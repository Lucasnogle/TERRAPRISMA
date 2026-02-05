/**
 * Wrapper para handlers async que captura erros e passa para o errorHandler
 * Evita try/catch repetitivo em cada controller
 * 
 * @param {Function} fn - Handler async (req, res, next)
 * @returns {Function} Handler com tratamento de erro
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
