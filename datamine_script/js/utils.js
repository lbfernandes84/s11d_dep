function findPathLocation(){
    var pathWindow = window.location.pathname.replace("%20"," ");
    while(pathWindow.indexOf("%20") != -1){
        pathWindow = pathWindow.replace("%20"," ");
    }
	pathWindow = pathWindow.split("/");
	pathWindow = pathWindow.slice(1,pathWindow.length-1);

	return(pathWindow);	
}

function printObject(object){
	var data = [];
	for(key in object){
		data.push(key+": "+object[key]);
	}
	return data.join("\n");
}

function field(strFile, fieldname, record) {
    var dmTable = new ActiveXObject("DmFile.DmTable");
    if (strFile.substr(strFile.length - 3).toLowerCase() == ".dm") {
        dmTable.Open(strFile, true);
    }
    else {
        dmTable.Open(oDmApp.ActiveProject.GetDBObjFilePath(strFile), true);
    }
    
    var returnValue = { exists : false, value : null };
    var nRecs = dmTable.GetRowCount();
    var dmSchema = dmTable.Schema;

    if (nRecs > 0 && record >= 0 && record <= nRecs) {
        index = dmSchema.GetFieldIndex(fieldname);
        if (index>=0) {
            if (record == 0) {
                returnValue.exists = true;
                returnValue.value = dmSchema.GetFieldDefault(index);
            }
            else {
                dmTable.GetRowAt(record);
                returnValue.exists = true;
                returnValue.value = dmTable.GetColumn(index);
            }
        } 
    }
    dmTable.Close();
    dmSchema = null;
    dmTable = null;
    return returnValue;
}

function sortByObjectKey(list,key){
    var keyValues = [];
    newList = new Array(list.length);
    for (var i = 0; i < list.length; i++) {
        keyValues.push(list[i][key]);
    };
    keyValues.sort();
    for (var i = 0; i < list.length; i++) {
        newList[keyValues.indexOf(list[i][key])] = list[i]
    };
    return newList;
}