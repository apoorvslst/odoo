const nodemailer = require('nodemailer');
const { db } = require('../db');
const { contacts, invoices, invoiceLines, products } = require('../db/schema');
const { eq } = require('drizzle-orm');

let transporter = null;

// Initialize Ethereal transporter
async function initTransporter() {
  if (transporter) return transporter;
  
  // Create a test account dynamically for Ethereal
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  
  console.log('Ethereal Email transporter initialized.');
  console.log('Username:', testAccount.user);
  return transporter;
}

/**
 * Send an email (Invoice or Reminder)
 * @param {number} invoiceId 
 * @param {boolean} isReminder - if true, email says "Reminder"
 */
async function sendInvoiceEmail(invoiceId, isReminder = false) {
  try {
    const t = await initTransporter();

    // 1. Fetch Invoice
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) throw new Error("Invoice not found");

    // 2. Fetch Contact (to get email)
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
    if (!contact) throw new Error("Contact not found");

    // 3. Fetch Lines
    const lines = await db
      .select({
        qty: invoiceLines.quantity,
        price: invoiceLines.unitPrice,
        desc: invoiceLines.description,
        productName: products.name
      })
      .from(invoiceLines)
      .leftJoin(products, eq(products.id, invoiceLines.productId))
      .where(eq(invoiceLines.invoiceId, invoiceId));

    // Calculate total amount from invoice
    const totalAmount = Number(invoice.totalAmount).toFixed(2);
    const docName = invoice.kind === 'bill' ? 'Purchase Order' : 'Invoice';

    // Subject
    const subject = isReminder 
      ? `Reminder: Payment Due for ${docName} #${invoice.id}`
      : `Your ${docName} #${invoice.id} from Vyapar360`;

    // Email Body (HTML)
    let linesHtml = lines.map(l => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${l.productName || l.desc}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${l.qty}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(l.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0056b3;">${isReminder ? 'Action Required: Payment Reminder' : 'Order Confirmation'}</h2>
        <p>Dear <strong>${contact.name}</strong>,</p>
        
        <p>${isReminder 
            ? `This is a friendly reminder that your ${docName} <strong>#${invoice.id}</strong> has an outstanding balance.` 
            : `Thank you for your business. Please find the details of your ${docName} below.`
        }</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Date:</strong> ${invoice.date}</p>
          <p style="margin: 5px 0 0 0;"><strong>Due Date:</strong> ${invoice.dueDate}</p>
          <p style="margin: 5px 0 0 0;"><strong>Total Amount:</strong> <span style="color: #d9534f; font-weight: bold;">₹${totalAmount}</span></p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #e9ecef;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <p>If you have any questions, please reply to this email.</p>
        <p>Best regards,<br><strong>Vyapar360 Team</strong></p>
      </div>
    `;

    // 4. Send Email
    // If contact has no email, fallback to a dummy one for testing
    const toEmail = contact.email || 'customer@example.com';
    
    let info = await t.sendMail({
      from: '"Vyapar360 Admin" <admin@vyapar360.local>', 
      to: toEmail, 
      subject: subject, 
      html: html, 
    });

    console.log("-----------------------------------------");
    console.log("Email sent to:", toEmail);
    console.log("Subject:", subject);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");

    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
}

module.exports = {
  sendInvoiceEmail
};
