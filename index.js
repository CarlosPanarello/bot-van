'use strict';

const express = require('express');
const bodyParser = require('body-parser');


const restService = express();
restService.use(bodyParser.json());

var retornaCodigo = function(entrada){
    switch(entrada) {
        case "Sede III":
            return '1';
        case "Sede IV":
            return '2';            
        case "Sede VI":
            return '3';
        case "Sede VII":
            return '4';
        case "Sede VIII":
            return '5';
        case "SIA Shopping":
            return '6';
        case "Capital Digital":
            return '7';  
        case "Edifício BB":
            return '8';                          
        default:
            return '';
    }
};

restService.post('/hook', function (req, res) {

    console.log('hook request');

    try {
        var speech = 'empty speech';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                if (requestBody.result.action) {
                    console.log('requestBody.result.action' + requestBody.result.action);
                    if(requestBody.result.action == "horario.van")
                    {
                        var ori = retornaCodigo(requestBody.result.parameters.origem);
                        var dest = retornaCodigo(requestBody.result.parameters.destino);
                        
                        speech += 'teste1: ' + ori  +' teste2: ' + dest;
                    }                    
                    
                    //speech += 'action: ' + requestBody.result.action;
                }
            }
        }

        console.log('result: ', speech);

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
