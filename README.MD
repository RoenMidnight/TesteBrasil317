# Teste Brasil317

Teste realizado para a Empresa Brasil317.

Tecnologias utilizadas:<br/>Cheerio, Node.JS (8.9.4), MongoDB (3.4).<br/>
<br/>

Foi realizado um Scraping na página do Portal da Previdência. Eu procurei tentar acessar todas as páginas com informações públicas do ano de 2017 onde se encontram as tabelas com os gastos, resolvi limitar o número de páginas recuperado em 5 para evitar estourar o limite do Banco de Dados.

Para ter acesso aos links, eu analisei o código da página inicial e encontrei o script onde era realizada diversas chamadas a uma função que redireciona o usuário para cada uma das páginas com as tabelas. Bastou eu realizar uma busca por estas chamadas, extrair os links, e inserir a variável que representa o ano de 2017.

A partir disto, tendo interesse apenas em extrair a informação sem me preocupar a priori com a organização, fiz um script genérico para que a informação contidas nas diversas tabelas fosse armazendos em uma única tabela no banco. 

Para botar em ação basta executar o arquivo index.js.
