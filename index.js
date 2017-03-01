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

                    if(!(!ori || 0 === ori.length) && !(!dest || 0 === dest.length)){
                        //  sync in node ¯\_(ツ)_/¯ but works !!!
                        var resposta = syncrequest(
                        'GET', 'https://vans.labbs.com.br/horario?idOrigem='+ ori +'&idDestino='+dest + '');
                        
                        var texto = '';
                        var info = JSON.parse(resposta.getBody());

                        console.log('info->'+ info);    

                        for(var i = 0; i < info.length; i++) {
                            texto +=info[i]+ ' ';
                        }

                        speech += 'Os horarios da van entre ' + descOrigem + ' para ' + descDestino + ' são ' + texto + '.';

                        console.log('retorno->'+ speech);                            
                    }
                }

                //Ação para obter localidades
                if(requestBody.result.action && requestBody.result.action == "localidades.van"){ 
                    console.log('acao de localidades');                 
                    var resposta = syncrequest('GET', 'https://vans.labbs.com.br/localidades');
                    var info = JSON.parse(resposta.getBody());
                    var texto = '';

                    if(info && info.length > 0){
                        for(var i = 0; i < info.length; i++) {
                            texto +=info[i].nome + ', ';
                        }
                        speech += 'Os locais atendidos pela Van são' + texto.substring(0, str.length - 2) + '.';
                        console.log('retorno->'+ speech);    
                    }
                }

            }
        }
        return res.json({
            speech: speech,
            displayText: speech,
            source: 'bot-van-bb'
        });
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
