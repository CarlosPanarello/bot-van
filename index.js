'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const syncrequest = require('sync-request');

const restService = express();

restService.use(bodyParser.json());

var retornaCodigo = function(entrada){
    entrada = entrada.toUpperCase();
    console.log('retornaCodigo Entrada->' + entrada);
    switch(entrada) {
        case "SEDE III":
            return '1';
        case "SEDE IV":
            return '2';            
        case "SEDE VI":
            return '3';
        case "SEDE VII":
            return '4';
        case "SEDE VIII":
            return '5';
        case "SIA SHOPPING":
            return '6';
        case "CAPITAL DIGITAL":
            return '7';  
        case "EDIFÍCIO BB":
            return '8';
        case "EDIFICIO BB":
            return '8'; 
        case "SEDE I":
            return '9';   
        case "SEDE II":
            return '10';   
        case "SEDE V":
            return '11';               
        default:
            return '';
    }
};

restService.post('/hook', function (req, res) {

    console.log('hook request');

    try {
        var speech = 'empty speech';
        var esperarResultado = true;
        
        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                //Ação para horario da Van    
                if(requestBody.result.action && requestBody.result.action == "horario.van"){  
                    console.log('acao de horario');                 
                    var descOrigem = requestBody.result.parameters.origem;
                    var descDestino = requestBody.result.parameters.destino;

                    var ori = retornaCodigo(requestBody.result.parameters.origem);
                    var dest = retornaCodigo(requestBody.result.parameters.destino);
                    console.log('Origem ->'+ ori); 
                    console.log('Destino ->'+ dest); 

                    if(!(!ori || 0 === ori.length)&& ori < 9 && !(!dest || 0 === dest.length) && dest < 9 && (dest != ori)){
                        //  sync in node ¯\_(ツ)_/¯ but works !!!
                        console.log('https://vans.labbs.com.br/horario?idOrigem='+ ori +'&idDestino='+dest + ''); 
                        
                        var resposta = syncrequest(
                        'GET', 'https://vans.labbs.com.br/horario?idOrigem='+ ori +'&idDestino='+dest + '');
                        
                        var texto = '';
                        var info = JSON.parse(resposta.getBody());

                        console.log('info->'+ info);    

                        for(var i = 0; i < info.length; i++) {
                            texto +=info[i]+ ' ';
                        }
                        if(!texto || 0 === texto.length){
                           speech += 'Desculpe mas não foi possivel obter os horarios entre ' + descOrigem + ' e ' + descDestino +'.'; 
                        } else {
                            speech += 'Os horarios da van entre ' + descOrigem + ' para ' + descDestino + ' são ' + texto + '.';
                        }
                        console.log('retorno->'+ speech);                       
                    } else if(!(!ori || 0 === ori.length) && ori > 8){
                        speech += descOrigem + ' não é atendido pela Van.';
                    } else if (!(!dest || 0 === dest.length) && dest > 8){
                        speech += descDestino + ' não é atendido pela Van.';
                    }
                }

                //Ação para obter localidades
                if(requestBody.result.action && requestBody.result.action == "localidades.van"){ 
                    console.log('acao de localidades');                 
                    var resposta = syncrequest('GET', 'https://vans.labbs.com.br/localidades');
                    var info = JSON.parse(resposta.getBody());
                    var texto = '';

                    var descLocal = requestBody.result.parameters.local;
                    var idLocal = retornaCodigo(requestBody.result.parameters.local); 
                    var encontrou = false;
                    console.log('local id->' + idLocal);
                    console.log('info->' + info);
                    if(info && info.length > 0){
                        for(var i = 0; i < info.length; i++) {
                            texto +=info[i].nome + ', ';
                            if(!(!idLocal || 0 === idLocal.length) && info[i].id == idLocal ){
                                encontrou = true;
                            }
                        }
                        
                        if(encontrou){
                            speech += descLocal + ' é atendido pela van.';
                        } else {
                            speech += 'Os locais atendidos pela Van são ' + texto.substring(0, texto.length - 2) + '.';
                        }

                        console.log('retorno->'+ speech);    
                    }
                }

            }
        }
        res.json({
            speech: speech,
            displayText: speech,
            source: 'bot-van-bb'
        });
        
        res.send();
        /*        
        return res.json({
            speech: speech,
            displayText: speech,
            source: 'bot-van-bb'
        });
        */
    } catch (err) {
        console.error("Não foi possivel obter a informação", err);
        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
