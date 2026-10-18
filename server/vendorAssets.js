const path=require('node:path');
module.exports={
 'react.production.min.js':path.join(path.dirname(require.resolve('react')),'umd/react.production.min.js'),
 'react-dom.production.min.js':path.join(path.dirname(require.resolve('react-dom')),'umd/react-dom.production.min.js'),
 'jspdf.umd.min.js':path.join(path.dirname(require.resolve('jspdf')),'jspdf.umd.min.js'),
};
