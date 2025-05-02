// pages/api/upload.js
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { google } from 'googleapis';
import path from 'path';

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export default async function handler(req, res) {
  console.log('API upload called');
  console.log('Body:', req.body);

  // 1) Generar PDF en memoria
  const doc = new PDFDocument({ margin: 30 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  doc.on('end', async () => {
    const pdfBuffer = Buffer.concat(buffers);
    console.log('PDF buffer length:', pdfBuffer.length);

    // 2) Configurar Google Drive API usando keyFilename
    let drive;
    try {
      const auth = new google.auth.GoogleAuth({
        keyFilename: path.join(process.cwd(), 'lib', 'service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });
      drive = google.drive({ version: 'v3', auth });
      console.log('GoogleAuth OK');
    } catch (e) {
      console.error('GoogleAuth error:', e);
      return res.status(500).json({ error: 'Authentication error' });
    }

    // 3) Subir PDF a Google Drive
    try {
      const parents = process.env.DRIVE_FOLDER_ID ? [process.env.DRIVE_FOLDER_ID] : [];
      const driveRes = await drive.files.create({
        requestBody: {
          name: `pedido-${req.body.pedidoNumber}.pdf`,
          parents
        },
        media: {
          mimeType: 'application/pdf',
          body: bufferToStream(pdfBuffer)
        }
      });
      console.log('Upload success, fileId:', driveRes.data.id);
      return res.status(200).json({ fileId: driveRes.data.id });
    } catch (e) {
      console.error('Drive upload error:', e);
      return res.status(500).json({ error: 'Drive upload failed' });
    }
  });

  // 4) Llena el contenido del PDF
  doc.fontSize(18).text('HIMETAL PEDIDOS', { align: 'center' }).moveDown();
  doc.fontSize(12)
     .text(`Pedido: ${req.body.pedidoNumber}   Hora: ${req.body.pedidoTime}`)
     .moveDown();
  doc.text(`Cliente: ${req.body.clientData.razonSocial}   CUIT: ${req.body.clientData.cuit}`).moveDown();
  doc.text('Datos de Despacho:')
     .text(`  Dirección: ${req.body.dispatchData.direccion}`)
     .text(`  Contacto: ${req.body.dispatchData.contactName}   Tel: ${req.body.dispatchData.contactPhone}`)
     .moveDown();
  doc.text('Items:');
  req.body.items.forEach((it, i) => {
    doc.text(
      `${i + 1}. ${it.code} – ${it.descripcion} | Cant: ${it.cantidad} | Precio/kg: ${it.precio} | Descarga: ${req.body.tipoDescarga}`
    );
  });

  // 5) Finalizar documento
  doc.end();
}
