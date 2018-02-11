const rp = require('request-promise');
const cheerio = require('cheerio');
const MongoClient = require('mongodb').MongoClient;

const uri = ""


/**
 * Cria a Collection que vai armazenar os dados
 */
MongoClient.connect(uri, function(err, db) {
    
    if(err) throw err;
    
    let dbo = db.db('scrapingTeste');

    dbo.createCollection("AllInformation", function(err, res) {
        if (err) throw err;
        console.log("Collection Criada");
        db.close();
    });
    
    db.close();
});

/**
 * Classe scrapingPT 
 */
var ScrapingPT = {

    /**
     * Array onde será armazenada a lista das páginas.
     */    
    listPages: [],

    /**
     * Função que irá acessar a página inicial e recuperar a lista com as páginas a serem percorridas.
     */
    initialPage: function (){
        
        const options = {
            uri: 'http://www.portaldatransparencia.gov.br/',
            transform: function(body){
                return cheerio.load(body);
            }
        };
        
        rp(options)
            .then(($) => {       

                console.log("Carregando Lista de Links");
                                
                let array_index = index($('script')[1].children[0].data, 'redirecionarParaPagina(\'');
                var str_body    = $('script')[1].children[0].data;
                
                for (i in array_index) {
                        let aux = str_body.substring(array_index[i], array_index[i] + str_body.substring(array_index[i]).indexOf(');'))
                        
                        this.listPages.push(setParameters(aux));
                    };
                                          
                for (i in this.listPages){
                    if(this.listPages[i] != 'http://br.transparencia.gov.br/tem/'){
                        this.crawlingThroughPages(this.listPages[i], 1);
                    }
                }
                
                return true;
            }
        )
            .catch((err) =>{
                console.log(err);
        });

        //Encontra possições das URL no script do site.
        function index(source, find) {
            var result = [];
            for (i = 0; i < source.length; ++i) {
              if (source.substring(i, i + find.length) == find) {
                result.push(i);
              }
            }
            return result;
        }

        /**
         * Limpa a URL e seta o ano de 2017.
         * @param url 
         * @return URL com o ano de 2017 em seu parametro.
         */
        function setParameters(url){
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


    /**
     * Função que irá percorrer as diversas páginas.
     * @param url URL atual que esta sendo percorrida.
     * @param pagina Pagina atual que esta sendo percorrida.
     * @return Retorna novamente a função de forma recursiva.
     */
    crawlingThroughPages: function(url,pagina){

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
                                    col_um: clearString($row.find('td')[0]),
                                    col_dois: clearString($row.find('td')[1]),
                                    col_tres: clearString($row.find('td')[2]),
                                    col_quatro: clearString($row.find('td')[3]),
                                    col_cinco: clearString($row.find('td')[4])
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
                        return this.crawlingThroughPages(url, ++pagina);
                    }
                }       
                        
            }
        )
        .catch((err) =>{
            console.log(err);
    });

        /**
         * Função que irá tratar as informações da tabela afim de extrair dela suas informações.
         * @param str_clear 
         * @return Retorna um Objeto composto do texto cru e a URL da célula caso possua.
         * @return Retorna o texto cru da célula.
         */

        function clearString(str_clear){            
                        
            if(str_clear !== undefined) {    
                
                if(str_clear.children[0] === undefined){
                    return null;
                }

                if(str_clear.children[0].data === undefined){    
                    
                    return {texto: str_clear.children[0].children[0].data, url: str_clear.children[0].children[0].href } ;
                }

                return str_clear.children[0].data.replace('/n','').replace(/\s/g, '').trim();   
            } 

            return null;
        }

    },



}.initialPage();
