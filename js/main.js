function __main (inputData) {
    //Dados predefinidos
    inputData.
}

function defineHorizontalDependencies(activitiesFileName, outputFileName){
    oDmApp.ParseCommand("extra &IN="+activitiesFileName+" &OUT=dep_temp_01 @APPROX=0 @PRINT=0"+
    " 'BENCH=BENCH*-1'"+
    " 'METODO1=METODO1*-1'"+
    " 'GO'");
     
    // ordena por SET->BENCH->METODO1->PHASE
    
    oDmApp.ParseCommand("mgsort &IN=dep_temp_01 &OUT=dep_temp_02 *KEY1=SET *KEY2=BENCH *KEY3=METODO1 *KEY4=PHASE *KEY5=CORTE *KEY6=SEQF @ORDER=1 @KEYSFRST=1 @ROWORDER=0");
    
    // volta BENCH e METODO1 aos valores originais depois dos registros estarem na ordem certa

    oDmApp.ParseCommand("extra &IN=dep_temp_02 &OUT=dep_temp_03 @APPROX=0 @PRINT=0"+
     " 'BENCH=BENCH*-1'" +
     " 'METODO1=METODO1*-1'" +
     " 'GO'");
     
     // Cria o campo ID_S que define o ID do sucessir para cada registro
     
     oDmApp.ParseCommand("extra &IN=dep_temp_03 &OUT=dep_temp_04 @APPROX=0 @PRINT=0" +
        // 1. Dependência Horizontal - mesmo SET, BENCH e METODO1, ordenação por PHASE
        "'IF (SET==next(SET) AND BENCH==next(BENCH) AND METODO1==next(METODO1)) and ''PHASE == NEXT(PHASE) and and CORTE == NEXT(CORTE)'" +
        " 'ID_S=next(BLOCKID)  ' " + 
        " 'LAYER;A24=\"1.IntraBENCH_IntraMET\" ' " + 
        " 'END'" +
        // 2. Dependência Horizontal - mesmo SET e BENCH, liga a última atividade do BoxCut (METODO1=2) para a primeira atividade lavrada por sistema (METODO1=1)
        " 'IF (SET==next(SET) AND BENCH==next(BENCH) AND METODO1!=next(METODO1)) ' " +
        " 'ID_S=next(BLOCKID)  ' " + 
        " 'LAYER=\"2.IntraBENCH_InterMET\" ' " + 
        " 'END'" +
        // Deletando links sem sucessor
        " 'IF (ID_S==absent()) delete() END' " +
        " 'GO'");
         
        // Adicionando campos necessários às dependencias
        oDmApp.ParseCommand("extra &IN=dep_temp_04 &OUT=dep_temp_05 @APPROX=0 @PRINT=0" +
         " 'M4DALKNO=-1'" +
         " 'M4DDELAY;A4=\"0mo\"'" +
         " 'M4DLTYPE;A4=\"FS\" '" +
         " 'M4DPROJ=-1'" +
         " 'ID_P=BLOCKID'" +
         " 'GO'");
                        
        // criando formato de arquivo
        oDmApp.ParseCommand("selcop &IN=dep_temp_05 &OUT=dep_temp_06 *F1=ID_P *F2=ID_S " +
        "*F3=M4DLTYPE *F4=LAYER *F5=M4DDELAY *F6=M4DPROJ *F7=M4DALKNO @KEEPALL=1");

}