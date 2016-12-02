#encoding: utf-8

import os
import math
import progressbar
import win32com.client

class SearchObjectCreator(object):

    def __init__(self,file_path,level_height):
        self.file_path = file_path
        self.level_height = level_height
    
    def create_search_object(self):
        if self.file_path[-3:] == 'csv':
            return self.__create_search_object_CSV()
        elif self.file_path[-3:] == '.dm':
            return self.__create_search_object_datamine()
    
    def __create_search_object_CSV(self):
        search_object = []
        file_obj = open(self.file_path)
        header = file_obj.readline().split(",")
        header_map = dict([(key,value) for value,key in list(enumerate(header))])
        line = file_obj.readline()
        levels_range = {}
        k=0
        while line:
            line_data = line.split(",")
            current_object = MineActivity()
            segment = line_data[header_map["SEGMENT"]]
            method = line_data[header_map["METHOD"]]
            setor = line_data[header_map["SET"]]
            x_coord = float(line_data[header_map["XPT"]])
            y_coord = float(line_data[header_map["YPT"]])
            z_coord = float(line_data[header_map["ZPT"]])
            bench = line_data[header_map["BENCH"]]
            phase = line_data[header_map["PHASE"]]
            level = int(line_data[header_map["LEVEL"]])
            seqf = int(line_data[header_map["SEQF"]])
            setattr(current_object, "segment", segment)
            setattr(current_object, "method", method)
            setattr(current_object, "setor", setor)
            setattr(current_object, "coordinates", [x_coord,y_coord,z_coord])
            setattr(current_object, "bench", bench)
            setattr(current_object, "phase", phase)
            setattr(current_object, "level", level)
            setattr(current_object, "seqf", seqf)
            search_object.append(current_object)
            bench = int(bench)
            if not bench in levels_range:
                levels_range[bench] = [k,-99999999]
            if k > levels_range[bench][1]:
                levels_range[bench][1] = k
            k+=1
            line = file_obj.readline()
            k+=1
        file_obj.close()
        return search_object,levels_range
    
    def __create_search_object_datamine(self):
        search_object =[]
        dm_table_obj =  win32com.client.Dispatch("DmFile.DmTableADO")
        dm_table_obj.Open(self.file_path,True)
        dm_table_obj.MoveFirst()
        benches_range = {}
        k=0 
        while not dm_table_obj.EOF:
            current_object = MineActivity()
            x_coord = dm_table_obj.GetNamedColumn("XPT")
            y_coord = dm_table_obj.GetNamedColumn("YPT")
            z_coord = dm_table_obj.GetNamedColumn("ZPT")
            setattr(current_object, "segment", (dm_table_obj.GetNamedColumn("SEGMENT")).strip())
            setattr(current_object, "method", dm_table_obj.GetNamedColumn("METHOD"))
            setattr(current_object, "setor", dm_table_obj.GetNamedColumn("SET"))
            setattr(current_object, "coordinates", [x_coord,y_coord,z_coord])
            setattr(current_object, "bench", dm_table_obj.GetNamedColumn("BENCH"))
            setattr(current_object, "phase", dm_table_obj.GetNamedColumn("PHASE").strip())
            setattr(current_object, "level", dm_table_obj.GetNamedColumn("LEVEL"))
            setattr(current_object, "seqf", dm_table_obj.GetNamedColumn("SEQF"))
            search_object.append(current_object)
            bench = int(dm_table_obj.GetNamedColumn("BENCH"))
            if not bench in benches_range:
                benches_range[bench] = [k,-99999999]
            if k > benches_range[bench][1]:
                benches_range[bench][1] = k
            k+=1
            dm_table_obj.MoveNext()
        dm_table_obj.Close()
        return search_object,benches_range

def get_phases_activities(search_objects):
    phases = {}
    for obj_ in search_objects:
        key = "-".join([str(obj_.bench) , obj_.phase])
        if not key in phases:
            phases[key] = []
        phases[key].append(obj_)
    return phases

class DepencenciesCreator(object):

    LEVEL_HEIGHT = 15

    def __init__(self,search_object,safety_distance):
        self.search_object = search_object
        self.safety_distance = safety_distance
        self.all_dependencies = set()
        self.horizontal_dependencies = []
        self.vertical_dependencies = []
        self.dependencies = []
        self.benches = []
        self.debug = False
        ############################ 
        # TODO:TESTE (REMOVER DEPOIS)
        # self.search_object = self.search_object[:1000]
        ############################ 
    
    def create_horizontal_dependencies(self):
        activities = self.search_object[:]
        num_objects = len(activities)
        print u"Número de atividades: %d" %(num_objects)
        pattern = lambda x: (x.setor, -1*x.bench,x.phase, x.level, x.seqf) 
        activities.sort(key=pattern)
        print u"Criando Dependências Horizontais"
        bar = progressbar.ProgressBar(maxval=num_objects,widgets=[progressbar.Bar('=', '[', ']'), ' ', progressbar.Percentage()])
        bar.start()
        for i in range(1,num_objects):
            prev_obj = activities[i-1]
            cur_obj = activities[i]
            if prev_obj.setor == cur_obj.setor and \
                prev_obj.bench == cur_obj.bench:
                self.horizontal_dependencies.append([cur_obj.segment, prev_obj.segment,"1.IntraBENCH_IntraMET"])
            #@teste
            # elif prev_obj.setor == cur_obj.setor and \
            #     prev_obj.bench == cur_obj.bench and \
            #     prev_obj.method != cur_obj.method:
            #     self.horizontal_dependencies.append([cur_obj.seqf, prev_obj.seqf,"2.IntraBENCH_InterMET"])
            # print self.horizontal_dependencies[-1]
            bar.update(i+1)
        bar.finish()
                

    def calculate_phases_vertical_dependencies(self,benches_range):
        num_obj = len(self.search_object)
        bar = progressbar.ProgressBar(maxval=num_obj,widgets=[progressbar.Bar('=', '[', ']'), ' ', progressbar.Percentage()])
        bar.start()
        print u"Criando Dependências Verticais..."
        for index in range(num_obj):            
            self.all_dependencies.update(self.__get_phases_dependencies(index,benches_range))
            bar.update(index+1)
        bar.finish()

    def __get_phases_dependencies(self,current_index,benches_range):
        mining_activity_obj = self.search_object[current_index]
        id = mining_activity_obj.segment
        setor = mining_activity_obj.setor
        coordinates = mining_activity_obj.coordinates
        bench = mining_activity_obj.bench
        phase = mining_activity_obj.phase
        dependencies = set()        
        # print bench,benches_range
        if not (int(bench) + 45) in benches_range:
            return dependencies
        inf_bound = benches_range[int(bench) + 45][0]
        sup_bound = benches_range[int(bench) + 45][1]        
        for index in range(inf_bound,sup_bound):            
            inspected_point_id = getattr(self.search_object[index],"segment")
            inspected_setor = getattr(self.search_object[index],"setor")
            inspected_coordinates = getattr(self.search_object[index],"coordinates")
            inspected_bench = getattr(self.search_object[index],"bench")
            inspected_phase = getattr(self.search_object[index],"phase")
            distance = planar_distance(inspected_coordinates,coordinates)
            if distance < self.safety_distance:
                sucessor = "-".join([str(bench) , str(phase)])
                predecessor = "-".join([str(inspected_bench) , str(inspected_phase)])
                if sucessor != predecessor and setor == inspected_setor:
                    dependencies.add("/".join([sucessor,predecessor]))
                # print "/".join([sucessor,predecessor])
        return dependencies

    def create_vertical_dependencies(self,phases_map):
        self.__sort_phases(phases_map)
        print "Numero de dependencias: ",len(self.all_dependencies)
        for dependencie in self.all_dependencies:
            components = dependencie.split("/")
            bench_phase_sucessor = components[0]
            bench_phase_predecessor = components[1]
            sucessor_activity_id = phases_map[bench_phase_sucessor][0].segment
            predecessor_activity_id = phases_map[bench_phase_predecessor][-1].segment
            self.vertical_dependencies.append([sucessor_activity_id,predecessor_activity_id,"3.150m_Vertical"])

    def __sort_phases(self,phases_map):
        sort_patern = lambda obj_ : (obj_.level, obj_.seqf)
        for key,item in phases_map.items():
            item.sort(key=sort_patern)

    def join_dependencies(self):
        static_fields = [-1,"0mo","FS",-1]
        self.dependencies.extend(self.horizontal_dependencies) 
        self.dependencies.extend(self.vertical_dependencies) 
        for dep in self.dependencies:
            dep.extend(static_fields)

    def create_datamine_output(self,output_file_name):
        dm_schema_obj =  win32com.client.Dispatch("DmFile.DmSchema")
        dm_table_obj =  win32com.client.Dispatch("DmFile.DmTable")
        self.__create_dm_fields(dm_schema_obj)
        dm_table_obj.Create(os.path.join(os.path.abspath(os.curdir),output_file_name),dm_schema_obj)
        for dependencie in self.dependencies:
            dm_table_obj.AddRow()
            dm_table_obj.SetColumn(1,dependencie[0])
            dm_table_obj.SetColumn(2,dependencie[1])
            dm_table_obj.SetColumn(3,dependencie[2])
            dm_table_obj.SetColumn(4,dependencie[3])
            dm_table_obj.SetColumn(5,dependencie[4])
            dm_table_obj.SetColumn(6,dependencie[5])
            dm_table_obj.SetColumn(7,dependencie[6])
        dm_table_obj.Close()

    def __create_dm_fields(self,schema):
        absent = schema.SpecialValueAbsent
        schema.AddStringColumn("ID_S",12,"",False)
        schema.AddStringColumn("ID_P",12,"",False)
        schema.AddStringColumn("LAYER",24,"",False)
        schema.AddNumericColumn("M4DALKNO",absent,False)
        schema.AddStringColumn("M4DDELAY",4,"",False)
        schema.AddStringColumn("M4DLTYPE",4,"",False)
        schema.AddNumericColumn("M4DPROJ",absent,False)
        
    def create_eps_output(self,output_file_name):
        alphanumeric_columns = [0,1,2]
        file_ = file(os.path.join(os.path.abspath(os.curdir),output_file_name),'w')
        self.__create_exf_header(file_)
        # 3,"1234","1235",FS,"M24D_Internal",0d,-1,-1,
        for dep in self.dependencies:
            line = ['\t\t3','"'+dep[1]+'"','"'+dep[0]+'"',dep[5],'"'+dep[2]+'"',dep[4],str(dep[6]),str(dep[3])]
            file_.write(",".join(line)+'\n')
        file_.close()

    
    def __create_exf_header(self,file_obj):
        file_obj.write("\n");
        file_obj.write("1,EXF File\n");
        file_obj.write("\t2,Version,Originator\n");
        file_obj.write('\t\t3,2.07,"Studio 5D Planner EPS Dependency Swap File"\n');
        file_obj.write("1,Dependencies\n");
        file_obj.write("\t2,From,To,Type,Layer,Lag,M4DPROJ,M4DALKNO\n");

def planar_distance(coord1,coord2):
    return math.sqrt(
        sum([
            (coord2[0] - coord1[0])**2,
            (coord2[1] - coord1[1])**2
            ])
    )

class MineActivity(object):

    def __init__(self):
        self.segment = None
        self.setor = None
        self.method = None
        self.coordinates = None
        self.bench = None
        self.phase = None
        self.level = None
        self.seqf = None
        
    def __repr__(self):
        return ", ".join(map(str, [self.segment, self.setor, self.method, self.coordinates, self.bench, self.phase, self.level, self.seqf]))+"\n"

if __name__ == '__main__':
    creator = SearchObjectCreator("dados\\dep_sort.dm",15)
    # creator = SearchObjectCreator("dados\\pointf0.csv",15)
    search_objects,ranges = creator.create_search_object()
    print(ranges)
    phases_map = get_phases_activities(search_objects)
    depencencies_creator = DepencenciesCreator(search_objects,50)
    depencencies_creator.create_horizontal_dependencies()
    depencencies_creator.calculate_phases_vertical_dependencies(ranges)
    depencencies_creator.create_vertical_dependencies(phases_map)
    depencencies_creator.join_dependencies()
    depencencies_creator.create_datamine_output("dependencies.dm");
    depencencies_creator.create_eps_output("eps_total.exf")
    # print(teste.dependencies) 