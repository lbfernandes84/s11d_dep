(function(){    

    var app = angular.module("s11d-dep",[]);
    var default_ = ["SEGMENT", "METHOD", "SET", "BENCH", "PHASE", "LEVEL", "SEQF"]

    app.controller("inputDataController",function(){
        //config fields
        this.segment = "SEGMENT";
        this.method = "METHOD";
        this.setor = "SET";
        this.bench = "BENCH";
        this.phase = "PHASE";
        this.level = "LEVEL";
        this.seqf = "SEQF";

        //Input data
        this.activitiesFileName = "";
        this.safetyDistance = 100;
        this.availableFields = [12334];
        this.sortFields = [];

        //Output Data
        this.dmDependencies = "100";
        this.exfDependencies = "200";

        this.setAvailableFields= function(fields){
            this.availableFields = fields;
        }

        this.browseFileActivities = function (){
            datamine.browseFile('activities','dmPointData')
            this.activitiesFileName = $("#activities").val();
            fields = datamine.getListFieldsFromFile(this.activitiesFileName);
            fields.sort()
            this.setAvailableFields(fields);
        }
    });
    
    
})()
