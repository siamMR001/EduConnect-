const getPaymentSuccessEmail = (studentName, amount, transactionId, type) => {
    const paymentTypeLabel = type === 'admission' ? 'Admission Registration' : 'Institutional Fee';
    
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Payment Received!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Thank you for your payment to EduConnect Academy</p>
            </div>
            
            <div style="padding: 40px 30px; color: #334155;">
                <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px;">Dear ${studentName},</h2>
                <p style="line-height: 1.6; margin-bottom: 25px;">We are pleased to confirm that your payment for <strong>${paymentTypeLabel}</strong> has been successfully processed.</p>
                
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #f1f5f9;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Transaction Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700; text-align: right;">$${(amount / 100).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Transaction ID:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${transactionId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Method:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">Stripe (Card/Wallet)</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${new Date().toLocaleDateString()}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 35px;">
                    <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Your account has been automatically updated. You can now access all features of the EduConnect portal.</p>
                    <a href="https://edu-connect-demo.vercel.app/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; transition: background-color 0.2s;">Go to Dashboard</a>
                </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 25px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0 0 10px 0;">&copy; 2026 EduConnect Academy. All rights reserved.</p>
                <p style="margin: 0;">This is an automated receipt. Please do not reply to this email.</p>
            </div>
        </div>
    `;
};

module.exports = { getPaymentSuccessEmail };
