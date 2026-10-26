/* Tabla de precios aproximados por ciudad y provincia (guía de precios). Mismas tarifas que la calculadora. */
(function(){
  'use strict';

  /* Provincias: [nombre, lat, lon, zona]  zona: P=península, I=islas */
  var PROV = [
    ['A Coruña',43.37,-8.40,'P'],['Álava',42.85,-2.67,'P'],['Albacete',38.99,-1.86,'P'],['Alicante',38.35,-0.48,'P'],
    ['Almería',36.84,-2.46,'P'],['Asturias',43.36,-5.85,'P'],['Ávila',40.66,-4.70,'P'],['Badajoz',38.88,-6.97,'P'],
    ['Baleares',39.57,2.65,'I'],['Barcelona',41.39,2.17,'P'],['Burgos',42.34,-3.70,'P'],['Cáceres',39.47,-6.37,'P'],
    ['Cádiz',36.53,-6.29,'P'],['Cantabria',43.46,-3.81,'P'],['Castellón',39.99,-0.04,'P'],['Ciudad Real',38.99,-3.93,'P'],
    ['Córdoba',37.89,-4.78,'P'],['Cuenca',40.07,-2.14,'P'],['Girona',41.98,2.82,'P'],['Granada',37.18,-3.60,'P'],
    ['Guadalajara',40.63,-3.17,'P'],['Guipúzcoa',43.32,-1.98,'P'],['Huelva',37.26,-6.95,'P'],['Huesca',42.14,-0.41,'P'],
    ['Jaén',37.77,-3.79,'P'],['La Rioja',42.47,-2.45,'P'],['Las Palmas',28.12,-15.43,'I'],['León',42.60,-5.57,'P'],
    ['Lleida',41.62,0.62,'P'],['Lugo',43.01,-7.56,'P'],['Madrid',40.42,-3.70,'P'],['Málaga',36.72,-4.42,'P'],
    ['Murcia',37.99,-1.13,'P'],['Navarra',42.82,-1.64,'P'],['Ourense',42.34,-7.86,'P'],['Palencia',42.01,-4.53,'P'],
    ['Pontevedra',42.43,-8.64,'P'],['Salamanca',40.97,-5.66,'P'],['Santa Cruz de Tenerife',28.47,-16.25,'I'],['Segovia',40.95,-4.12,'P'],
    ['Sevilla',37.39,-5.98,'P'],['Soria',41.76,-2.46,'P'],['Tarragona',41.12,1.25,'P'],['Teruel',40.34,-1.11,'P'],
    ['Toledo',39.86,-4.02,'P'],['Valencia',39.47,-0.38,'P'],['Valladolid',41.65,-4.72,'P'],['Vizcaya',43.26,-2.93,'P'],
    ['Zamora',41.50,-5.75,'P'],['Zaragoza',41.65,-0.89,'P']
  ];

  /* Tarifas: base local, importe por distancia, embalaje, montaje, guardamuebles (1 mes) */
  var TARIFAS = {
    estudio:{n:'Estudio',          base:240,km:0.45,emb:90, mon:80, gua:70},
    piso12: {n:'Piso 1-2 hab.',    base:380,km:0.65,emb:160,mon:130,gua:110},
    piso3:  {n:'Piso 3+ hab.',     base:600,km:0.95,emb:290,mon:210,gua:180},
    casa:   {n:'Casa / Chalet',    base:880,km:1.25,emb:420,mon:300,gua:260},
    oficina:{n:'Oficina',          base:700,km:1.00,emb:320,mon:170,gua:200}
  };
  var GRUA = 230, RECARGO_ISLAS = 550, KM_LOCAL = 30, FACTOR_RUTA = 1.25;

  var $ = function(id){return document.getElementById(id)};
  function haversine(a,b){
    var R=6371, rad=Math.PI/180;
    var dLat=(b[1]-a[1])*rad, dLon=(b[2]-a[2])*rad;
    var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return 2*R*Math.asin(Math.sqrt(h));
  }
  var fmt = function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')};
  var round10 = function(n){return Math.round(n/10)*10};

  /* Tabla de precios dinámica (provincia + ciudad) */
  (function(){
    var selP = $('select-provincia'), selC = $('select-ciudad'), body = $('tabla-body'), cap = $('tabla-caption'), nota = $('tabla-nota');
    if(!selP || !selC || !body) return;
    var FIJAS = ['Madrid','Barcelona','Vizcaya','Valencia','Sevilla','Zaragoza','Alicante','Málaga'];
    var MUNI = {
      "A Coruña":"A Coruña,43.37,-8.40;Santiago de Compostela,42.88,-8.54;Ferrol,43.48,-8.23;Narón,43.50,-8.14;Oleiros,43.33,-8.31;Arteixo,43.30,-8.51;Carballo,43.21,-8.69;Culleredo,43.29,-8.38;Ribeira,42.56,-9.00;Cambre,43.29,-8.34;Betanzos,43.28,-8.21;Sada,43.35,-8.25",
      "Álava":"Vitoria-Gasteiz,42.85,-2.67;Llodio,43.14,-2.96;Amurrio,43.05,-3.00;Alegría-Dulantzi,42.84,-2.51;Salvatierra,42.86,-2.37;Laguardia,42.55,-2.58;Oyón,42.41,-2.42",
      "Albacete":"Albacete,38.99,-1.86;Hellín,38.51,-1.70;Villarrobledo,39.27,-2.60;Almansa,38.87,-1.10;La Roda,39.21,-2.15;Caudete,38.71,-0.99;Tobarra,38.60,-1.69;Chinchilla de Monte-Aragón,38.92,-1.73;Casas-Ibáñez,39.28,-1.46;Tarazona de la Mancha,39.26,-1.92",
      "Alicante":"Alicante,38.35,-0.48;Elche,38.27,-0.70;Torrevieja,37.98,-0.68;Orihuela,38.08,-0.94;Benidorm,38.54,-0.13;Alcoy,38.70,-0.47;San Vicente del Raspeig,38.40,-0.52;Elda,38.48,-0.79;Dénia,38.84,0.11;Santa Pola,38.19,-0.56;Villena,38.63,-0.87;Petrer,38.48,-0.77;Calp,38.64,0.04",
      "Almería":"Almería,36.84,-2.46;Roquetas de Mar,36.76,-2.61;El Ejido,36.78,-2.81;Níjar,36.97,-2.21;Vícar,36.83,-2.64;Adra,36.75,-3.02;Huércal-Overa,37.39,-1.94;Vera,37.25,-1.86;Huércal de Almería,36.89,-2.44;La Mojonera,36.77,-2.70",
      "Asturias":"Gijón,43.53,-5.66;Oviedo,43.36,-5.85;Avilés,43.56,-5.92;Siero,43.39,-5.66;Langreo,43.30,-5.69;Mieres,43.25,-5.77;Castrillón,43.58,-6.03;San Martín del Rey Aurelio,43.28,-5.68;Llanera,43.43,-5.83;Corvera de Asturias,43.50,-5.85;Cangas de Onís,43.35,-5.13;Llanes,43.42,-4.75",
      "Ávila":"Ávila,40.66,-4.70;Arévalo,41.06,-4.72;Arenas de San Pedro,40.21,-5.09;Candeleda,40.16,-5.24;Sotillo de la Adrada,40.29,-4.57;El Barraco,40.44,-4.62;Las Navas del Marqués,40.60,-4.34;Cebreros,40.46,-4.47;Navaluenga,40.37,-4.70;Piedrahíta,40.46,-5.33",
      "Badajoz":"Badajoz,38.88,-6.97;Mérida,38.92,-6.34;Don Benito,38.96,-5.86;Almendralejo,38.68,-6.41;Villanueva de la Serena,38.97,-5.80;Zafra,38.42,-6.42;Montijo,38.91,-6.62;Olivenza,38.68,-7.10;Villafranca de los Barros,38.56,-6.34;Llerena,38.24,-6.02",
      "Baleares":"Palma,39.57,2.65;Calvià,39.57,2.51;Ibiza,38.91,1.43;Manacor,39.57,3.21;Llucmajor,39.49,2.89;Marratxí,39.64,2.76;Maó,39.89,4.26;Inca,39.72,2.91;Santa Eulalia del Río,38.98,1.53;Ciutadella de Menorca,40.00,3.84;Alcúdia,39.85,3.12;Sant Antoni de Portmany,38.98,1.30",
      "Barcelona":"Barcelona,41.39,2.17;L'Hospitalet de Llobregat,41.36,2.10;Badalona,41.45,2.25;Terrassa,41.56,2.01;Sabadell,41.54,2.11;Mataró,41.54,2.44;Santa Coloma de Gramenet,41.45,2.21;Cornellà de Llobregat,41.36,2.07;Sant Cugat del Vallès,41.47,2.09;Manresa,41.73,1.83;Rubí,41.49,2.03;Vilanova i la Geltrú,41.22,1.73;Granollers,41.61,2.29",
      "Burgos":"Burgos,42.34,-3.70;Miranda de Ebro,42.69,-2.95;Aranda de Duero,41.67,-3.69;Briviesca,42.55,-3.32;Medina de Pomar,42.93,-3.48;Lerma,42.03,-3.75;Salas de los Infantes,42.02,-3.28;Belorado,42.42,-3.19;Villagonzalo Pedernales,42.33,-3.62",
      "Cáceres":"Cáceres,39.47,-6.37;Plasencia,40.03,-6.09;Navalmoral de la Mata,39.89,-5.54;Coria,39.99,-6.54;Trujillo,39.46,-5.88;Miajadas,39.15,-5.90;Moraleja,40.06,-6.65;Jaraíz de la Vera,40.07,-5.75;Valencia de Alcántara,39.41,-7.24;Arroyo de la Luz,39.49,-6.59",
      "Cádiz":"Jerez de la Frontera,36.68,-6.14;Cádiz,36.53,-6.29;Algeciras,36.13,-5.45;San Fernando,36.46,-6.20;El Puerto de Santa María,36.60,-6.23;Chiclana de la Frontera,36.42,-6.15;Sanlúcar de Barrameda,36.78,-6.35;La Línea de la Concepción,36.17,-5.35;Puerto Real,36.53,-6.19;Barbate,36.19,-5.92;Conil de la Frontera,36.28,-6.09;Arcos de la Frontera,36.75,-5.81;Rota,36.62,-6.36",
      "Cantabria":"Santander,43.46,-3.81;Torrelavega,43.35,-4.05;Castro-Urdiales,43.38,-3.22;Camargo,43.41,-3.88;Piélagos,43.43,-3.93;El Astillero,43.40,-3.82;Santa Cruz de Bezana,43.45,-3.85;Laredo,43.41,-3.41;Los Corrales de Buelna,43.26,-4.07;Santoña,43.44,-3.46;Colindres,43.40,-3.45;Reinosa,43.00,-4.14",
      "Castellón":"Castellón de la Plana,39.99,-0.04;Vila-real,39.94,-0.10;Burriana,39.89,-0.09;Vinaròs,40.47,0.48;La Vall d'Uixó,39.82,-0.23;Benicarló,40.42,0.43;Onda,39.96,-0.26;Almassora,39.95,-0.06;Nules,39.85,-0.15;Segorbe,39.85,-0.49;Peñíscola,40.36,0.41;Benicàssim,40.05,0.07",
      "Ciudad Real":"Ciudad Real,38.99,-3.93;Puertollano,38.69,-4.11;Tomelloso,39.16,-3.02;Alcázar de San Juan,39.39,-3.21;Valdepeñas,38.76,-3.38;Manzanares,38.99,-3.37;Daimiel,39.07,-3.61;La Solana,38.94,-3.24;Campo de Criptana,39.40,-3.12;Miguelturra,38.96,-3.89;Bolaños de Calatrava,38.91,-3.65",
      "Córdoba":"Córdoba,37.89,-4.78;Lucena,37.41,-4.48;Puente Genil,37.39,-4.77;Montilla,37.59,-4.64;Priego de Córdoba,37.44,-4.20;Cabra,37.47,-4.44;Palma del Río,37.70,-5.28;Baena,37.62,-4.32;Pozoblanco,38.38,-4.85;Peñarroya-Pueblonuevo,38.31,-5.27;Aguilar de la Frontera,37.51,-4.65;Rute,37.32,-4.37",
      "Cuenca":"Cuenca,40.07,-2.14;Tarancón,40.01,-3.01;San Clemente,39.40,-2.43;Motilla del Palancar,39.57,-1.90;Las Pedroñeras,39.44,-2.69;Quintanar del Rey,39.34,-1.93;Mota del Cuervo,39.50,-2.87;Iniesta,39.44,-1.75;Belmonte,39.56,-2.71;Horcajo de Santiago,39.83,-2.72",
      "Girona":"Girona,41.98,2.82;Figueres,42.27,2.96;Blanes,41.67,2.79;Lloret de Mar,41.70,2.84;Olot,42.18,2.49;Salt,41.97,2.79;Palafrugell,41.92,3.16;Sant Feliu de Guíxols,41.78,3.03;Roses,42.26,3.18;Banyoles,42.12,2.77;Palamós,41.85,3.13;Santa Coloma de Farners,41.86,2.67",
      "Granada":"Granada,37.18,-3.60;Motril,36.75,-3.52;Almuñécar,36.73,-3.69;Armilla,37.14,-3.62;Maracena,37.21,-3.63;Las Gabias,37.13,-3.66;Loja,37.17,-4.15;Guadix,37.30,-3.14;Baza,37.49,-2.77;Albolote,37.23,-3.65;Atarfe,37.22,-3.69;La Zubia,37.12,-3.58",
      "Guadalajara":"Guadalajara,40.63,-3.17;Azuqueca de Henares,40.57,-3.26;Cabanillas del Campo,40.63,-3.23;El Casar,40.69,-3.41;Alovera,40.59,-3.26;Marchamalo,40.67,-3.20;Yebes,40.62,-3.19;Villanueva de la Torre,40.63,-3.30;Sigüenza,41.07,-2.64;Molina de Aragón,40.84,-1.89",
      "Guipúzcoa":"San Sebastián,43.32,-1.98;Irún,43.34,-1.79;Errenteria,43.31,-1.90;Eibar,43.18,-2.47;Zarautz,43.28,-2.17;Arrasate/Mondragón,43.06,-2.49;Hernani,43.27,-1.98;Hondarribia,43.36,-1.79;Tolosa,43.14,-2.07;Pasaia,43.32,-1.93;Lasarte-Oria,43.27,-2.01;Beasain,43.05,-2.20",
      "Huelva":"Huelva,37.26,-6.95;Lepe,37.25,-7.20;Almonte,37.26,-6.52;Moguer,37.27,-6.84;Isla Cristina,37.20,-7.32;Ayamonte,37.21,-7.40;Cartaya,37.28,-7.15;Bollullos Par del Condado,37.34,-6.54;Punta Umbría,37.18,-6.97;San Juan del Puerto,37.31,-6.83;Valverde del Camino,37.57,-6.75;Aljaraque,37.27,-7.02",
      "Huesca":"Huesca,42.14,-0.41;Monzón,41.91,0.19;Barbastro,42.04,0.13;Fraga,41.52,0.35;Jaca,42.57,-0.55;Sabiñánigo,42.52,-0.36;Binéfar,41.85,0.29;Tamarite de Litera,41.87,0.43;Graus,42.19,0.33;Sariñena,41.78,-0.15",
      "Jaén":"Jaén,37.78,-3.79;Linares,38.09,-3.64;Andújar,38.04,-4.05;Úbeda,38.01,-3.37;Alcalá la Real,37.46,-3.92;Martos,37.72,-3.97;Bailén,38.10,-3.78;Baeza,37.99,-3.47;Torredonjimeno,37.77,-3.95;Villacarrillo,38.12,-3.10;Alcaudete,37.59,-4.09;La Carolina,38.28,-3.61",
      "La Rioja":"Logroño,42.47,-2.45;Calahorra,42.31,-1.96;Arnedo,42.23,-2.10;Haro,42.58,-2.85;Santo Domingo de la Calzada,42.44,-2.95;Nájera,42.42,-2.73;Alfaro,42.18,-1.75;Lardero,42.43,-2.45;Villamediana de Iregua,42.44,-2.39;Cervera del Río Alhama,42.02,-1.96;Autol,42.21,-2.00",
      "Las Palmas":"Las Palmas de Gran Canaria,28.12,-15.43;Telde,27.99,-15.42;Santa Lucía de Tirajana,27.91,-15.54;San Bartolomé de Tirajana,27.76,-15.57;Arucas,28.12,-15.52;Arrecife,28.96,-13.55;Ingenio,27.92,-15.44;Agüimes,27.91,-15.45;Gáldar,28.15,-15.65;Teguise,29.06,-13.56;Puerto del Rosario,28.50,-13.86;Mogán,27.88,-15.72",
      "León":"León,42.60,-5.57;Ponferrada,42.55,-6.60;San Andrés del Rabanedo,42.62,-5.62;Astorga,42.46,-6.06;La Bañeza,42.30,-5.90;Villaquilambre,42.64,-5.55;Valencia de Don Juan,42.29,-5.52;Bembibre,42.62,-6.43;Villablino,42.94,-6.32;Cacabelos,42.60,-6.73;Sahagún,42.37,-5.03;Boñar,42.87,-5.32",
      "Lleida":"Lleida,41.62,0.62;Balaguer,41.79,0.81;Tàrrega,41.65,1.14;Mollerussa,41.63,0.89;La Seu d'Urgell,42.36,1.46;Cervera,41.67,1.27;Alpicat,41.67,0.57;Solsona,41.99,1.52;Tremp,42.17,0.89;Almacelles,41.73,0.43;Les Borges Blanques,41.52,0.87;Vielha e Mijaran,42.70,0.80",
      "Lugo":"Lugo,43.01,-7.56;Monforte de Lemos,42.52,-7.51;Viveiro,43.66,-7.59;Vilalba,43.30,-7.68;Burela,43.66,-7.36;Foz,43.57,-7.26;Sarria,42.78,-7.41;Ribadeo,43.54,-7.04;Chantada,42.61,-7.77;Monterroso,42.79,-7.83",
      "Madrid":"Madrid,40.42,-3.70;Móstoles,40.32,-3.86;Alcalá de Henares,40.48,-3.36;Fuenlabrada,40.28,-3.80;Leganés,40.33,-3.76;Getafe,40.31,-3.73;Alcorcón,40.35,-3.82;Torrejón de Ardoz,40.46,-3.48;Parla,40.24,-3.77;Alcobendas,40.55,-3.64;Las Rozas de Madrid,40.49,-3.87;San Sebastián de los Reyes,40.55,-3.63;Pozuelo de Alarcón,40.43,-3.81;Rivas-Vaciamadrid,40.35,-3.54;Coslada,40.43,-3.56",
      "Málaga":"Málaga,36.72,-4.42;Marbella,36.51,-4.89;Vélez-Málaga,36.78,-4.10;Mijas,36.60,-4.64;Fuengirola,36.54,-4.63;Torremolinos,36.62,-4.50;Benalmádena,36.60,-4.57;Estepona,36.43,-5.15;Rincón de la Victoria,36.72,-4.27;Antequera,37.02,-4.56;Ronda,36.74,-5.17;Alhaurín de la Torre,36.66,-4.56;Nerja,36.75,-3.88",
      "Murcia":"Murcia,37.99,-1.13;Cartagena,37.60,-0.99;Lorca,37.68,-1.70;Molina de Segura,38.05,-1.21;Alcantarilla,37.97,-1.22;Torre-Pacheco,37.74,-0.96;Águilas,37.41,-1.58;Cieza,38.24,-1.42;Yecla,38.61,-1.11;Mazarrón,37.60,-1.31;San Javier,37.80,-0.84;Jumilla,38.48,-1.33;Totana,37.77,-1.50",
      "Navarra":"Pamplona,42.81,-1.65;Tudela,42.06,-1.61;Barañáin,42.80,-1.68;Burlada,42.83,-1.60;Estella-Lizarra,42.67,-2.03;Zizur Mayor,42.78,-1.69;Tafalla,42.53,-1.67;Villava,42.83,-1.61;Ansoáin,42.83,-1.63;Cintruénigo,42.07,-1.80;Corella,42.11,-1.78;Alsasua,42.90,-2.17;Sangüesa,42.57,-1.28",
      "Ourense":"Ourense,42.34,-7.86;Verín,41.94,-7.44;O Barco de Valdeorras,42.42,-6.98;O Carballiño,42.43,-8.07;Xinzo de Limia,42.06,-7.72;Ribadavia,42.29,-8.14;A Rúa,42.40,-7.11;Celanova,42.15,-7.96;Allariz,42.19,-7.80",
      "Palencia":"Palencia,42.01,-4.53;Aguilar de Campoo,42.79,-4.26;Guardo,42.79,-4.84;Venta de Baños,41.92,-4.49;Villamuriel de Cerrato,41.99,-4.50;Cervera de Pisuerga,42.86,-4.50;Carrión de los Condes,42.34,-4.60;Saldaña,42.52,-4.74;Baltanás,41.94,-4.25;Paredes de Nava,42.15,-4.69",
      "Pontevedra":"Vigo,42.24,-8.72;Pontevedra,42.43,-8.64;Vilagarcía de Arousa,42.60,-8.77;Redondela,42.28,-8.61;Marín,42.39,-8.70;Cangas,42.26,-8.78;Lalín,42.66,-8.11;Ponteareas,42.18,-8.54;Sanxenxo,42.40,-8.81;Tui,42.05,-8.65;Moaña,42.28,-8.74;O Porriño,42.16,-8.62",
      "Salamanca":"Salamanca,40.97,-5.66;Santa Marta de Tormes,40.96,-5.62;Béjar,40.39,-5.76;Ciudad Rodrigo,40.60,-6.53;Villamayor,41.00,-5.68;Carbajosa de la Sagrada,40.93,-5.64;Peñaranda de Bracamonte,40.90,-5.20;Guijuelo,40.56,-5.67;Alba de Tormes,40.83,-5.52;Cabrerizos,40.99,-5.62",
      "Santa Cruz de Tenerife":"Santa Cruz de Tenerife,28.46,-16.25;San Cristóbal de La Laguna,28.49,-16.31;Arona,28.10,-16.68;Adeje,28.12,-16.73;Santa Cruz de La Palma,28.68,-17.76;Los Llanos de Aridane,28.66,-17.92;Puerto de la Cruz,28.41,-16.55;Granadilla de Abona,28.12,-16.58;La Orotava,28.39,-16.52;Candelaria,28.35,-16.37;Los Realejos,28.37,-16.58;Icod de los Vinos,28.37,-16.72",
      "Segovia":"Segovia,40.95,-4.12;Cuéllar,41.40,-4.31;El Espinar,40.72,-4.23;San Cristóbal de Segovia,40.93,-4.08;La Lastrilla,40.97,-4.10;Real Sitio de San Ildefonso,40.90,-4.00;Nava de la Asunción,41.17,-4.70;Riaza,41.26,-3.46;Cantalejo,41.25,-3.91",
      "Sevilla":"Sevilla,37.39,-5.98;Dos Hermanas,37.28,-5.92;Alcalá de Guadaíra,37.34,-5.84;Utrera,37.18,-5.78;Mairena del Aljarafe,37.35,-6.06;Écija,37.54,-5.08;Los Palacios y Villafranca,37.16,-5.93;La Rinconada,37.49,-5.98;Coria del Río,37.29,-6.05;Carmona,37.47,-5.64;San Juan de Aznalfarache,37.36,-6.03;Lebrija,36.92,-6.07",
      "Soria":"Soria,41.76,-2.46;Almazán,41.49,-2.53;El Burgo de Osma,41.59,-3.07;San Esteban de Gormaz,41.57,-3.22;Ágreda,41.85,-1.92;Covaleda,41.93,-2.89;Medinaceli,41.17,-2.43;Golmayo,41.77,-2.50;San Leonardo de Yagüe,41.82,-3.07;Duruelo de la Sierra,41.91,-2.98",
      "Tarragona":"Tarragona,41.12,1.25;Reus,41.16,1.11;Vila-seca,41.11,1.14;Cambrils,41.07,1.06;El Vendrell,41.22,1.54;Salou,41.08,1.14;Tortosa,40.81,0.52;Valls,41.29,1.25;Amposta,40.71,0.58;Calafell,41.20,1.57;Cunit,41.20,1.63;Torredembarra,41.15,1.40",
      "Teruel":"Teruel,40.34,-1.11;Alcañiz,41.05,-0.13;Andorra,40.98,-0.45;Calamocha,40.92,-1.30;Utrillas,40.81,-0.85;Montalbán,40.83,-0.80;Valderrobres,40.87,0.15;Albarracín,40.41,-1.44;Alcorisa,40.88,-0.38;Mora de Rubielos,40.25,-0.75",
      "Toledo":"Toledo,39.86,-4.02;Talavera de la Reina,39.96,-4.83;Illescas,40.12,-3.84;Seseña,40.10,-3.69;Sonseca,39.68,-3.97;Torrijos,39.98,-4.28;Fuensalida,40.06,-4.23;Madridejos,39.47,-3.53;Consuegra,39.46,-3.60;Quintanar de la Orden,39.59,-3.05;Mora,39.69,-3.77;Ocaña,39.96,-3.50",
      "Valencia":"Valencia,39.47,-0.38;Torrent,39.44,-0.47;Gandia,38.97,-0.18;Paterna,39.50,-0.44;Sagunto,39.68,-0.28;Alzira,39.15,-0.44;Mislata,39.48,-0.42;Burjassot,39.51,-0.41;Ontinyent,38.82,-0.61;Xàtiva,38.99,-0.52;Manises,39.49,-0.46;Aldaia,39.47,-0.46;Alboraya,39.50,-0.35;Sueca,39.20,-0.31",
      "Valladolid":"Valladolid,41.65,-4.72;Laguna de Duero,41.58,-4.72;Medina del Campo,41.31,-4.91;Arroyo de la Encomienda,41.62,-4.80;Zaratán,41.65,-4.79;Tordesillas,41.50,-4.99;Íscar,41.37,-4.53;Tudela de Duero,41.59,-4.57;Simancas,41.59,-4.82;Peñafiel,41.60,-4.12;Cigales,41.75,-4.70;La Cistérniga,41.60,-4.65",
      "Vizcaya":"Bilbao,43.26,-2.93;Barakaldo,43.30,-2.99;Getxo,43.36,-3.01;Portugalete,43.32,-3.02;Santurtzi,43.33,-3.03;Basauri,43.24,-2.89;Leioa,43.33,-2.98;Galdakao,43.23,-2.84;Sestao,43.31,-3.01;Durango,43.17,-2.63;Erandio,43.31,-2.97;Mungia,43.35,-2.85;Sopela,43.38,-2.98",
      "Zamora":"Zamora,41.50,-5.75;Benavente,42.00,-5.68;Toro,41.52,-5.39;Morales del Vino,41.48,-5.72;Villaralbo,41.53,-5.80;Puebla de Sanabria,42.05,-6.63;Fuentesaúco,41.34,-5.50;Alcañices,41.69,-6.35;Villalpando,41.85,-5.40;Bermillo de Sayago,41.37,-6.12",
      "Zaragoza":"Zaragoza,41.65,-0.89;Calatayud,41.35,-1.64;Utebo,41.71,-1.00;Ejea de los Caballeros,42.13,-1.14;Tarazona,41.90,-1.72;Caspe,41.23,-0.04;Cuarte de Huerva,41.61,-0.93;Alagón,41.77,-1.12;Zuera,41.87,-0.78;La Almunia de Doña Godina,41.48,-1.38;Borja,41.84,-1.53;Tauste,41.92,-1.25"
    };
    function parseMuni(s){ return s.split(';').map(function(x){ var a = x.split(','); return [a[0],+a[1],+a[2]]; }); }
    var DEST = [['Madrid','Madrid'],['Barcelona','Barcelona'],['Valencia','Valencia'],['Sevilla','Sevilla'],['Bilbao','Vizcaya'],['Zaragoza','Zaragoza'],['Málaga','Málaga'],['Alicante','Alicante'],['A Coruña','A Coruña'],['Murcia','Murcia'],['Valladolid','Valladolid'],['Oviedo','Asturias']];
    var BANDAS = [[100,300,200],[300,550,420],[550,850,700],[850,3000,1000]];
    var TIPOS = ['estudio','piso12','piso3','casa'], LABELS = ['Estudio','Piso 1-2 hab','Piso 3+ hab','Casa / Chalet'];
    var TRAMOS = [
      ['Mudanza local (misma ciudad)','Menos de 30 km',0,29],
      ['Provincias cercanas','30-100 km',30,100],
      ['Mudanza regional','100-300 km',100,300],
      ['Mudanza entre provincias','300-600 km',300,600],
      ['Mudanza de larga distancia','Más de 600 km',600,1000]
    ];
    function byName(n){ for(var i=0;i<PROV.length;i++){ if(PROV[i][0]===n) return PROV[i]; } return null; }
    function ciudadesDe(p){ var pr = byName(p); return MUNI[p] ? parseMuni(MUNI[p]) : [[p+' capital',pr[1],pr[2]]]; }
    function f(tipo,km,extra){ var t=TARIFAS[tipo]; return t.base + Math.max(0,km-KM_LOCAL)*t.km + extra; }
    function range(tipo,a,b,ea,eb){ return fmt(round10(f(tipo,a,ea)*0.88))+'-'+fmt(round10(f(tipo,b,eb)*1.18))+' €'; }
    function row(dest,dist,a,b,ea,eb){
      var tds = '<td data-label="Destino">'+dest+'</td><td data-label="Distancia aprox.">'+dist+'</td>';
      TIPOS.forEach(function(t,i){ tds += '<td data-label="'+LABELS[i]+'">'+range(t,a,b,ea,eb)+'</td>'; });
      return '<tr>'+tds+'</tr>';
    }
    function destinos(origen,provOrigen){
      var zo = byName(provOrigen)[3];
      var cand = [];
      DEST.forEach(function(d){
        if(d[1]===provOrigen) return;
        var pr = byName(d[1]); if(!pr) return;
        cand.push({n:d[0], km:Math.round(haversine(origen,pr)*FACTOR_RUTA), extra:(zo!==pr[3])?RECARGO_ISLAS:0});
      });
      var elegidos = [];
      BANDAS.forEach(function(b){
        var best = null;
        cand.forEach(function(c){
          if(elegidos.indexOf(c)>-1 || c.km<b[0] || c.km>b[1]) return;
          if(!best || Math.abs(c.km-b[2])<Math.abs(best.km-b[2])) best = c;
        });
        if(best) elegidos.push(best);
      });
      cand.sort(function(a,b){ return a.km-b.km; });
      cand.forEach(function(c){ if(elegidos.length<3 && elegidos.indexOf(c)<0) elegidos.push(c); });
      return elegidos.sort(function(a,b){ return a.km-b.km; });
    }
    function fillCiudades(){
      var p = selP.value;
      selC.innerHTML = '';
      var d = document.createElement('option'); d.value = '';
      if(p==='all'){ d.textContent = 'Selecciona primero una provincia'; selC.appendChild(d); selC.disabled = true; return; }
      d.textContent = 'Selecciona una ciudad / municipio'; selC.appendChild(d);
      ciudadesDe(p).forEach(function(c,i){ var o = document.createElement('option'); o.value = i; o.textContent = c[0]; selC.appendChild(o); });
      var ot = document.createElement('option'); ot.value = 'otro'; ot.textContent = 'Otro municipio / localidad'; selC.appendChild(ot);
      selC.disabled = false;
    }
    function render(){
      var p = selP.value, ci = selC.value, html = '';
      if(p==='all' || ci===''){
        TRAMOS.forEach(function(r){ html += row(r[0],r[1],r[2],r[3],0,0); });
        cap.textContent = 'Precio aproximado de una mudanza según el tipo de trayecto';
        nota.textContent = 'Estimación general por tramo de distancia (precio mínimo del inicio del tramo y máximo del final). ' + (p==='all' ? 'Elige provincia y ciudad de origen para ver destinos concretos.' : 'Elige ahora una ciudad o municipio para ver destinos concretos desde tu origen.');
      } else {
        var pr = byName(p), otro = (ci==='otro'), c = otro ? ['otro municipio de '+p, pr[1], pr[2]] : ciudadesDe(p)[+ci];
        html += row('Trayecto local (misma ciudad y alrededores)','Menos de 30 km',0,0,0,0);
        destinos(c,p).forEach(function(d){ html += row(d.n,'≈ '+fmt(d.km)+' km',d.km,d.km,d.extra,d.extra); });
        cap.textContent = otro ? 'Precios aproximados de mudanza desde otro municipio de '+p : 'Precios aproximados de mudanza desde '+c[0]+' ('+p+')';
        nota.textContent = (otro ? 'Estimación orientativa basada en la provincia de '+p+' (se toma su capital como punto de partida). ' : 'Destinos representativos de distancia corta, media y larga desde '+c[0]+'. ') + 'Para otra ruta, usa la calculadora de arriba.' + (pr[3]==='I' ? ' Incluye recargo de ferry hacia la península.' : '');
      }
      body.innerHTML = html;
      [body,cap].forEach(function(el){ el.classList.remove('fade-in'); void el.offsetWidth; el.classList.add('fade-in'); });
    }
    var otras = document.createElement('optgroup'); otras.label = 'Otras provincias';
    PROV.forEach(function(p){
      if(FIJAS.indexOf(p[0])>-1) return;
      var op = document.createElement('option'); op.value = p[0]; op.textContent = p[0]; otras.appendChild(op);
    });
    selP.appendChild(otras);
    selP.addEventListener('change',function(){ fillCiudades(); render(); });
    selC.addEventListener('change',render);
    fillCiudades(); render();
  })();
})();
