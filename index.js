const rp = require('request-promise');
const cheerio = require('cheerio');
const MongoClient = require('mongodb').MongoClient;

var uri = "mongodb://RoenMidnight:RoenOwona@cluster0-shard-00-00-ho3uq.mongodb.net:27017,cluster0-shard-00-01-ho3uq.mongodb.net:27017,cluster0-shard-00-02-ho3uq.mongodb.net:27017/scrapingTeste?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"

var scrapingPT = {
    
    listaPaginas: [],

    paginaInicial: function (){
        
        const options = {
            uri: 'http://www.portaldatransparencia.gov.br/',
            transform: function(body){
                return cheerio.load(body);
            }
        };
        
        rp(options)
            .then(($) => {       

                console.log("Carregando Lista de Links");
                                
                let arrayIndex = indexes($('script')[1].children[0].data, 'redirecionarParaPagina(\'');
                var strBody    = $('script')[1].children[0].data;
                
                for (i in arrayIndex) {
                        let aux = strBody.substring(arrayIndex[i], arrayIndex[i] + strBody.substring(arrayIndex[i]).indexOf(');'))
                        
                        this.listaPaginas.push(setaParametros(aux));
                    };
                                          
                for (i in this.listaPaginas){
                    if(this.listaPaginas[i] != 'http://br.transparencia.gov.br/tem/'){
                        this.crawlingInMySkin(this.listaPaginas[i], 1);
                    }
                }
                
                //console.log(this.listaPaginas);
                return true;
            }
        )
            .catch((err) =>{
                console.log(err);
        });

        //Encontra possições das URL no script do site.
        function indexes(source, find) {
            var result = [];
            for (i = 0; i < source.length; ++i) {
              if (source.substring(i, i + find.length) == find) {
                result.push(i);
              }
            }
            return result;
        }

        //Limpa URL's e me retorna os links já preenchidos.
        function setaParametros(url){
            url = url.replace('redirecionarParaPagina(\'','')
                .replace('\' + getAnoExercicioSelecionado()','2017')                          
                .replace(/\s/g, '')
                .replace(/'+'/g, '')
                .replace(/\'/g, '')
                .replace('+codAcao+','8442')      
                .replace('+anoSelecionado','2017');
            
                
            return url;
        }
        
    },    

    crawlingInMySkin: function(url,pagina){

        const options = {
            uri: 'http://www.portaldatransparencia.gov.br/'+url+'&Pagina='+pagina,
            transform: function(body){
                return cheerio.load(body);
            }
        };

        rp(options)
            .then(($) => {

                var rows = [];
                var cols = []; 

                console.log('URL: '+ options.uri);
            
                if($('#listagem > table tr').length != 0){

                    console.log('Paginação: '+pagina);

                    $('#listagem > table tr').each(function(i,n){
                        var $row = $(n);                        
                        if (i != 0){ 
                            rows.push({
                                    url: url,
                                    col_um: trataString($row.find('td')[0]),
                                    col_dois: trataString($row.find('td')[1]),
                                    col_tres: trataString($row.find('td')[2]),
                                    col_quatro: trataString($row.find('td')[3]),
                                    col_cinco: trataString($row.find('td')[4])
                                });
                        } 
                    });

                    console.log(rows);
                    MongoClient.connect(uri, function(err, db) {
                        
                        if(err) throw err;
                        
                        let dbo = db.db('scrapingTeste');

                        dbo.collection("AllInformation").insertMany(rows, function(err, res) {
                            if (err) throw err;
                            console.log("Número de registros inseridos: " + res.insertedCount);
                            db.close();
                        });
                        
                        db.close();
                    });

               
                    console.log('----------------------')

                    if (pagina < 5){
                        return this.crawlingInMySkin(url, ++pagina);
                    }
                }       
                        
                return true;
            }
        )
        .catch((err) =>{
            console.log(err);
    });

        function trataString(strTratar){            
                        
            if(strTratar !== undefined) {    
                
                if(strTratar.children[0] === undefined){
                    return null;
                }

                if(strTratar.children[0].data === undefined){    
                    
                    return {texto: strTratar.children[0].children[0].data, url: strTratar.children[0].children[0].href } ;
                }

                return strTratar.children[0].data.replace('/n','').replace(/\s/g, '').trim();   
            } 

            return null;
        }

    },



}.paginaInicial();