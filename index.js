const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


const corsOptions = {
    origin: '*', // Consider restricting this to your frontend's domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  
  app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());
app.use('/users', require('./routes/users'))
app.use('/booking', require('./routes/booking'))
app.use('/dispatch', require('./routes/dispatch'))

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});