/*
*  ДАнный пример реализуют базу для REST API,
*  т.е. это роутер по "папкам" которые запрашивает юзер с соответствующими обработчиками
*
*/

const http = require("http"); // сервер
const url = require('url'); // работа с урлом
const opt = require('optimist');
const config = require('./config');
const { StringDecoder } = require('string_decoder');

global.echo = function() {
	console.log.apply(this, arguments);
};

let cnt = 1;

echo('process.argv = ', process.argv);
echo('optimist: process.argv = ', opt.argv);
console.log('HOME = ', process.env.HOME);
console.log('NODE_ENV = ', process.env.NODE_ENV);


// функция принимает 2 параметра - запрос от юзера и ответ.
// из объекта запроса мы вычленяем все данные которые нас интересуют (метод запроса, параметры, путь и пр)
// с помощью объекта ОТВЕТ - мы можем формировать ответ юзеру (устанавливать заголовок, статус код, и тело ответа)
function processRequest(req, res) {
	// get URL and parse it
	const parsedURL = url.parse(req.url, true);
	const originalPath = parsedURL.pathname; // path without domain name
	const trimmedPath = (originalPath.replace(/^\/+|\/+$/g, '')).replace(/\/\//g, '/');

	const queryStringObj = parsedURL.query; // get params from URL string
	const { headers, method } = req; // user request method & headers

	const decoder = new StringDecoder('utf-8'); // созжать объект декодера, который умеет декодировать строку в utf-8

	let buffer = '';

	req.on('data', function(data){ // повесить колбэк на событие data (request got payload)
		buffer += decoder.write(data);
	});

	req.on('end', function(){
		buffer += decoder.end();
		echo('>> Got ', cnt++, 'request , URL: ', originalPath, ', trimmedPath: ',trimmedPath, ', params: ', queryStringObj);
		echo('>> Method: ', method, ', headers: ', headers);
		echo('>> Payload from User: ', buffer);

		// work done, send response to user
		const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
		const data = {
			trimmedPath,
			queryStringObj,
			method,
			headers,
			payload: buffer,
		};

		chosenHandler(data, function (statusCode, payload) {
			statusCode = typeof statusCode == 'number' ? statusCode : 200;
			payload = typeof payload == 'object' ? payload : {}; // if payload is not sent
			const payloadString = JSON.stringify(payload); // convert payload from handler to string

			res.setHeader('Content-type', 'application/json')
			res.writeHead(statusCode);
			//res.end('Take that bro!\n' + payloadString); // тоже самое что и строчка ниже, только при ответе в формате "text/plain"
			res.end(payloadString); // возвращаем объект JSON в формате строки
			echo('>> From choseHandler done:', statusCode, payloadString);
		});// end of chosenHandler
	}); // end of req.on(END)
} // end of processRequest



/////////// SERVER
// echo('\x1Bc'); // - очищает командную строку (историю)
echo('>> Starting server...');
const server = http.createServer(processRequest);
server.listen(config.port, () => {
	echo('WebServer is running at http://localhost:', config.port, ', ENV = ', config.envName);
});


//////// HANDLERS - обработчики событий для маршрутизатора, т.е. реакция на соответствующий запрос URL
const handlers = {};

handlers.person = function(data, callback) { // ROUTE 1 - sample
	callback('ffff', { name: 'This is from "person" URL handler...' + data.trimmedPath }); // отдает код http ответа + объект с данными
	return null;
};

handlers.personFolder1 = function(data, callback) { // ROUTE 2 - sample
	// если предположить, что это должен быть ПОСТ запрос
	let resultObj = { name: 'This is from "person/Folder1" URL handler...' + data.trimmedPath };
	if (data.method !== "GET") {
		resultObj = { name: 'This route (URL) doesn\'t suport "'  + data.method + '" method' };
		callback(501, resultObj); // отдает код http ответа + объект с данными
		return null;
	}
	callback(200, resultObj); // отдает код http ответа + объект с данными
	return null;
};

handlers.notFound = function(data, callback) { // ROUTE 2 - not found
	callback(404, { name: 'No such file or folder ' + data.trimmedPath }); // отдает код http ответа + объект с данными
	return null;
};

/////////// ROUTER
const router = {
	'person': handlers.person,
	'person/folder1': handlers.personFolder1,
};

