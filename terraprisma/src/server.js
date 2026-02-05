const app = require('./app');
require('dotenv').config();

if (process.env.NODE_ENV !== 'production') {
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
}
