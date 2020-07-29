const MAX = 100, MIN = 80;

function getMessage() {
  const length = Math.floor(Math.random() * (MAX - MIN + 1) + MIN);
  var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function isError() {
   return Math.random() < 0.05;
}

module.exports = {
   getMessage,
   isError,
};