# SocketSpeak

A real-time chat application built with Node.js, Express, Socket.IO, and React.

## Features

- Real-time messaging using Socket.IO
- User authentication
- MongoDB database integration
- Cloudinary for image uploads
- Modern React frontend

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/socketspeak.git
cd socketspeak
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_uri
PORT=5001
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

4. Start the development server:
```bash
cd backend
npm install
npm run dev
```
5. Start the frontend server:
```bash
cd frontend
npm install
npm run dev
```


## Project Structure

```
socketspeak/
├── backend/           # Backend server code
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── index.js
│   └── package.json
├── frontend/          # Frontend React code
│   ├── src/
│   └── package.json
└── package.json       # Root package.json
```


## License

This project is licensed under the ISC License. 
