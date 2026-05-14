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

    const { candidateName, registrationText, pdfBase64, pdfFileName, cvBase64, cvFileName } = body;

    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return { statusCode: 500, body: 'Email service not configured' };
    }

    const attachments = [{ filename: pdfFileName, content: pdfBase64 }];
    if (cvBase64 && cvFileName) {
        attachments.push({ filename: cvFileName, content: cvBase64 });
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'GTP Tech Registration <onboarding@resend.dev>',
            to: ['gemma@gtptech.co.uk'],
            reply_to: 'gemma@gtptech.co.uk',
            subject: `New candidate registration — ${candidateName}`,
            text: registrationText,
            attachments
        })
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('Resend error:', response.status, text);
        return { statusCode: 500, body: 'Email send failed' };
    }

    return { statusCode: 200, body: 'OK' };
};
