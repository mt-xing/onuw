// Test Server
// Runs on port 8080
// Connect via the /onuw endpoint

import express from 'express';
import { createServer } from 'http';
// @ts-ignore
import { Server } from 'socket.io';
import OnuwServer from './server.js';

const port = process.env.PORT || 8080;

const app = express();
const http = createServer(app);
const io = new Server(http, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

http.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`listening on *:${port}`);
});

const onuwGame = new OnuwServer(io.of('/onuw'));
