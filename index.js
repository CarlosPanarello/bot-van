'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const restService = express();

restService.use(bodyParser.json());

const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err));
    });
}

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
}

var retornaDados = function (res,speech) {
    console.log('retornaDados res->'+ res);
    res.json({
            speech: speech,
            displayText: speech,
            source: 'bot-van-bb'
        });
    res.send();
}

var retornaDadosErro = function (res,err) {
    console.log('retornaDadosErro res->'+ res);

    res.status(400).json({
        status: {
            code: 400,
            errorType: err.message
        }
    });
    res.send();
}

var trataRetornoLocalidades = function(resposta,res,descLocal,idLocal,requestBody){
    console.log('trataRetornoLocalidades res->'+ res);
    console.log(resposta);
    var info = JSON.parse(resposta);
    var texto = '';
    console.log('info_local->'+ info);
    console.log('requestBody->' +requestBody);
    console.log('descLocal->'+ descLocal);
    console.log('idLocal->'+ idLocal);
    var encontrou = false;
    if(info && info.length > 0){
        for(var i = 0; i < info.length; i++) {
            texto +=info[i].nome + ', ';
            if(info[i].id == idLocal ){
                encontrou = true;
            }
        }
        
        if(encontrou){
            speech += descLocal + ' é atendido pela van.';
        } else {
            speech += 'Os locais atendidos pela Van são ' + texto.substring(0, texto.length - 2) + '.';
        }

        console.log('retorno->'+ speech);    
        retornaDados(res,speech);
    }
}

var trataRetornoHorarios = function(resposta,res){
    console.log('trataRetornoHorarios res->'+ res);
    var texto = '';
    var info = JSON.parse(resposta.getBody());

    console.log('info_hora->'+ info);

    for(var i = 0; i < info.length; i++) {
        texto +=info[i]+ ' ';
    }
    if(!texto || 0 === texto.length){
        speech += 'Desculpe mas não foi possivel obter os horarios entre ' + descOrigem + ' e ' + descDestino +'.'; 
    } else {
        speech += 'Os horarios da van entre ' + descOrigem + ' para ' + descDestino + ' são ' + texto + '.';
    }
    console.log('retorno->'+ speech);  
    retornaDados(res,speech);
}

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
                        console.log('https://vans.labbs.com.br/horario?idOrigem='+ ori +'&idDestino='+dest + ''); 
                        getContent('https://vans.labbs.com.br/horario?idOrigem='+ ori +'&idDestino='+dest + '')
                            .then((html) => trataRetornoHorarios(html,res), (err) => retornaDadosErro(res,err))
                            .catch((err) => retornaDadosErro(res,err));
                    } else if(!(!ori || 0 === ori.length) && ori > 8){
                        speech += descOrigem + ' não é atendido pela Van.';
                        retornaDados(res,speech);
                    } else if (!(!dest || 0 === dest.length) && dest > 8){
                        speech += descDestino + ' não é atendido pela Van.';
                        retornaDados(res,speech);
                    }
                }

                //Ação para obter localidades
                if(requestBody.result.action && requestBody.result.action == "localidades.van"){ 
                    console.log('acao de localidades');                 
                    console.log('res->' + res);       
                    var descLocal = requestBody.result.parameters.local;
                    var idLocal = retornaCodigo(requestBody.result.parameters.local);   
                    
                    console.log('descLocal->' + descLocal);
                    console.log('idLocal->' + idLocal);

                    getContent('https://vans.labbs.com.br/localidades')
                        .then((html) => trataRetornoLocalidades(html,res,descLocal,idLocal,requestBody), (err) => retornaDadosErro(res,err))
                        .catch((err) => retornaDadosErro(res,err));
                }
            }
        }
    } catch (err) {
        console.error("Não foi possivel obter a informação", err);
        retornaDadosErro(res,err);
    }
});

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
