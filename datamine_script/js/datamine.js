var dmSchema = new ActiveXObject("DmFile.DmSchema");
var oScript = null;
var oDmApp = null;
var dmHandlerAdo = null;
var dmHandlerTable = null;
var dmSchema = null;
var _debug = true;

var datamine = {
	"createStudioConnection": dm_createStudioConnection,
	"createDmtableHandlerObj":dm_createDmtableHandlerObj,
  "createDmSchemaObj":dm_createDmSchemaObj,
  "browseFile":dm_browseFile,
  "browseFileExcel":dm_browseFileExcel,
  "deleteTempFiles":dm_deleteTempFiles,
  "existsFileOnProject":dm_existsFileOnProject,
  "getNumberOfRecordsFromFile":dm_getNumberOfRecordsFromFile,
	"print":dm_printOnCommandScreen,
  //Ignorar os seguintes metodos
  "saveConfigObject":dm_saveConfigObject,
  "loadConfigFile":dm_loadConfigFile,
  "StatusBarHandler":DM_StatusBarHandler
};

/*The below functions works like private Methods, do not access it directly!*/
 function dm_createStudioConnection(){            
    try{
       oScript = new ActiveXObject("StudioCommon.ScriptHelper");               
    }
    catch(e){
       oScript = new ActiveXObject("DatamineStudio.ScriptHelper");
    }
    oScript.initialize(window);
    oDmApp = oScript.getApplication();                           
 }

 function dm_createDmtableHandlerObj(flag){
 	flag = flag || "ado"
 	if(flag == "ado"){
 		dmHandlerAdo = new ActiveXObject("DmFile.DmTableADO"); 		 
    return dmHandlerAdo;
 	}
 	else if(flag =="table"){
 		dmHandlerTable = new ActiveXObject("DmFile.DmTable");
    return dmHandlerTable;
 	}  
} 

 function dm_createDmSchemaObj(){
	dmSchema = new ActiveXObject("DmFile.DmSchema"); 		
  return dmSchema;
 } 

function dm_browseFile(id,tipoFiltro,id2){
  var browser = oDmApp.ActiveProject.Browser;
  browser.TypeFilter = oScript.DmFileType[tipoFiltro];
  browser.Show(false);            
  document.getElementById(id).value = browser.FileName;
  
 if (tipoFiltro == "dmWireframe" && id2 != null){
    var component2;
    component2 = document.getElementById(id2);
    if (document.getElementById(id).value != ""){
       component2.value = document.getElementById(id).value.slice(0,document.getElementById(id).value.length - 2) + "pt";
    }
    else {
       component2.value = "";
    }
 }
}

function dm_browseFileExcel(id,extension){
  extension = extension || "xlsx"
  var browser = oDmApp.System.BrowseForFile(
    true,
    "*."+extension+"|*."+extension,
    "report."+extension,
    extension+" files|*."+extension,
    oDmApp.ActiveProject.Folder,
    false)
  var components = browser.split("\\");
  document.getElementById(id).value = components[components.length - 1];
}

function dm_deleteTempFiles(prefix){
  if(!oDmApp.ActiveProject.DBObjExists("debug")){
      oDmApp.ControlBars.Command.Suppress = true;
      oDmApp.ParseCommand("dir &OUT=LIXO {"+prefix+"?}");
      oDmApp.ParseCommand("dir &OUT=LIXO {"+prefix+"?}");
      oDmApp.ParseCommand("delete &IN=LIXO @CONFIRM=0");    
      oDmApp.ControlBars.Command.Suppress = false;
  }
}

function dm_existsFileOnProject(fileName){
    return(oDmApp.ActiveProject.DBObjExists(fileName));
}

function dm_getNumberOfRecordsFromFile(fileName){
     var numRecords = 0;
    if(oDmApp.ActiveProject.DBObjExists(fileName)){
      var dmHandler = dm_createDmtableHandlerObj()
      dmHandler.Open(oDmApp.ActiveProject.GetDBObjFilePath(fileName),false);
      numRecords = dmHandler.GetRowCount()
      dmHandler.Close();
    }
    return numRecords;
}

function dm_saveConfigObject(selector,fileName){
  var configObj = {};
  $(selector).each(function(index){
    if($(this).prop("type")  == "text"){
      configObj[this.id + "|text"] = this.value;
    }
    else if($(this).prop("type") == "radio" && $(this).prop("checked")){
      configObj[this.id+ "|radio"] = 1;      
    }
    else if($(this).prop("type") == "checkbox" && $(this).prop("checked")){
      configObj[this.id+ "|checkbox"] = 1;      
    }
    // else{
    //   configObj[this.id+ "|select"] = $(this);      
    // }
    // alert(this.id);
  })
  return configObj
}

function dm_loadConfigFile(fileName){
  var configObj = oScript.varload(fileName);
  var information=null;
  var id=null;
  var type=null;
  for(key in configObj){
    information = key.split("|");
    id = information[0];
    type = information[1];
    if(type=="text"){
      $("#"+ id).val(configObj[key]);
    }
    else if(type=="radio" || type=="checkbox"){
      $("#"+ id).prop("checked",Number(configObj[key]))
    }
  }
  return configObj;
}

function DM_StatusBarHandler(studioNativeStatusBar,secondaryStatusBar){

    this.delta = 0;
    this.mainStatusBar = studioNativeStatusBar;
    if(secondaryStatusBar){
        this.secondaryStatusBar = secondaryStatusBar.object_;
        this.secondaryStatusBar.SetProgress = this.secondaryStatusBar[secondaryStatusBar.SetProgress];
        this.secondaryStatusBar.SetText = this.secondaryStatusBar[secondaryStatusBar.SetText];
    }

    this.updateProgress = function(increment){
        this.delta+=increment
        this.mainStatusBar.SetProgress(this.delta*100,100);
        if (this.secondaryStatusBar){
            this.secondaryStatusBar.SetProgress(this.delta);
        }
    }

    this.updateText = function(text){
        this.mainStatusBar.Text = text;
        if (this.secondaryStatusBar){
            this.secondaryStatusBar.SetText(text);
        }
    }
}

function dm_printOnCommandScreen(message){
  oDmApp.ControlBars.Command.WriteLine(message);
}