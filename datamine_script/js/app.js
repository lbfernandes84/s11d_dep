(function(){    

    var app = angular.module("s11d-dep",[]);

    app.controller("inputDataController",function(){
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