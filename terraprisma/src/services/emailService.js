const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { loggers } = require('../utils/logger');

let transporter = null;

/**
 * Inicializa o transporter do Nodemailer (singleton)
 */
const getTransporter = () => {
    if (transporter) return transporter;

    if (!config.smtp?.host) {
        loggers.email.warn('SMTP not configured. Emails will be simulated.');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port || 587,
        secure: config.smtp.secure || false,
        auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
        },
    });

    loggers.email.info('Nodemailer transporter initialized');
    return transporter;
};

/**
 * Carrega template HTML
 * @param {string} templateName
 * @returns {string}
 */
const loadTemplate = (templateName) => {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template não encontrado: ${templateName}`);
    }

    return fs.readFileSync(templatePath, 'utf-8');
};

/**
 * Substitui variáveis no template
 * @param {string} template
 * @param {object} variables
 * @returns {string}
 */
const renderTemplate = (template, variables) => {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        rendered = rendered.replace(regex, value || '');
    }

    return rendered;
};

module.exports = {
    getTransporter,
    loadTemplate,
    renderTemplate,
};
