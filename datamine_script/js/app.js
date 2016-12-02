(function(){    

    var app = angular.module("s11d-dep",[]);

    app.controller("inputDataController",function(){
        //Input data
        this.activitiesFileName = "";
        this.safetyDistance = 100;
        this.availableFields = null;

        //Output Data
        this.safetyDistance = 100;
    });
    
    
})()