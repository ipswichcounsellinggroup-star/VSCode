exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    const { name, email, phone, company, message, cvBase64, cvFileName } = body;

    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return { statusCode: 500, body: 'Email service not configured' };
    }

    const lines = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        company ? `Company: ${company}` : null,
        message ? `\nMessage:\n${message}` : null,
    ].filter(Boolean).join('\n');

    const payload = {
        from: 'GTP Tech Contact Form <onboarding@resend.dev>',
        to: ['recruitment@gtptech.co.uk'],
        reply_to: email,
        subject: `New callback request — ${name}`,
        text: lines,
    };

    if (cvBase64 && cvFileName) {
        payload.attachments = [{ filename: cvFileName, content: cvBase64 }];
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('Resend error:', response.status, text);
        return { statusCode: 500, body: 'Email send failed' };
    }

    return { statusCode: 200, body: 'OK' };
};
