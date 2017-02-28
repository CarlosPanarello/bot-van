'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const restService = express();

restService.use(bodyParser.json());

var retornaCodigo = function(entrada){
    entrada = entrada.toUpperCase();
    console.log('Entrada->' + entrada);
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

                if (requestBody.result.action) {
                    console.log('requestBody.result.action->' + requestBody.result.action);
                    if(requestBody.result.action == "horario.van")
                    {                        
                        var descOrigem = requestBody.result.parameters.origem;
                        var descDestino = requestBody.result.parameters.destino;
                        
                        var ori = retornaCodigo(requestBody.result.parameters.origem);
                        var dest = retornaCodigo(requestBody.result.parameters.destino);
                        
                        if(!(!ori || 0 === ori.length) && !(!dest || 0 === dest.length) ){
                            
                            // Set the headers
                            var headers = {
                                'User-Agent':       'Super Agent/0.0.1',
                                'Content-Type':     'application/x-www-form-urlencoded'
                            };

                            // Configure the request
                            var options = {
                                uri: 'https://vans.labbs.com.br/horario',                                
                                method: 'GET',
                                headers: headers,                                
                                qs: {'idOrigem': ori, 'idDestino': dest}
                            };
                            speech = 'Não foi possível obter os horarios.0';
                            // Start the request
                            
                            request(options, function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    // Print out the response body
                                    var info = JSON.parse(body);
                                    var horariosVans = '';
                                    console.log('REQUEST->'+body);
                                    console.log('Info->'+info);
                                    console.log('Info-Length->'+info.length);
                                                                                            
                                    for(var i = 0; i < info.length; i++) {
                                        horariosVans +=info[i]+ ' ';
                                    }
                                    console.log('Horarios->' + horariosVans);
                                    if ( horariosVans.length > 0){
                                        //speech += 'Horarios da van entre ' + descOrigem + ' e '+ descDestino + ' são: '+ horariosVans.trim() + '.';                                  
                                        speech = horariosVans+ '.';                                    
                                    } else {
                                        speech = 'Não foi possível obter os horarios.1';
                                    }
                                    //speech += 
                                    //console.log('REQUEST->'+body);
                                }else{
                                    speech = 'Não foi possível obter os horarios.2';
                                    console.log('ERROR->'+error);
                                    console.log('status->'+response.statusCode);
                                }
                                console.log('dentro do request speech->'+speech);
                                esperarResultado = false;
                            });
                            console.log('esperarResultado->'+esperarResultado);
                            console.log('antes do wait speech->'+ speech);
                            //POG ¯\_(ツ)_/¯ mas funciona
                            while(esperarResultado){
                                //console.log('Esperando');
                            }
                            console.log('depois do wait speech->'+ speech);
                            console.log('esperarResultado->'+esperarResultado);
                            //var seconds = 5;
                            //var esperarAte = new Date(new Date().getTime() + seconds * 1000);
                            //while(esperarAte > new Date()){}
                            
                        } else {
                            speech = 'Precisa de dois parametros';
                        }
                    }                    
                }
            }
        }

        //console.log('result do speech->', speech);

        return res.json({
            speech: speech,
            displayText: speech,
            source: 'bot-van-bb'
        });
    } catch (err) {
        console.error("Can't process request", err);

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
