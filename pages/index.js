import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  // Listas de datos
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  // Estados del formulario
  const [pedidoNumber, setPedidoNumber] = useState('');
  const [pedidoTime, setPedidoTime] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [clientData, setClientData] = useState({
    razonSocial: '', direccion: '', telefono: '', empresa: '', observaciones: '', cuit: '', localidad: '', provincia: ''
  });
  const [dispatchData, setDispatchData] = useState({ direccion: '', contactName: '', contactPhone: '' });
  const [items, setItems] = useState([{ code: '', cantidad: '', diferencia: '', descripcion: '', precio: '' }]);
  const [vendorCode, setVendorCode] = useState('');
  const [tipoDescarga, setTipoDescarga] = useState('');

  // Carga de datos desde /public/data
  useEffect(() => {
    // Clientes
    fetch('/data/clients.json')
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(c => ({
          code: String(c['Código']),
          razonSocial: c['Nombre'] || '',
          direccion: c['Dirección'] || '',
          telefono: c['Teléfonos'] != null ? String(c['Teléfonos']) : '',
          empresa: c['Nombre'] || '',
          observaciones: '',
          cuit: c['CUIT                            e-mail'] || '',
          localidad: c['Localidad'] || '',
          provincia: c['Provincia'] || ''
        }));
        setClients(normalized);
      })
      .catch(err => console.error('Error loading clients.json', err));

    // Vendedores
    fetch('/data/vendors.json')
      .then(res => res.json())
      .then(data => setVendors(data))
      .catch(err => console.error('Error loading vendors.json', err));

    // Materia Prima
    fetch('/data/rawmaterials.json')
      .then(res => res.json())
      .then(data => setRawMaterials(data))
      .catch(err => console.error('Error loading rawmaterials.json', err));
  }, []);

    // Hora actualizada cada minuto
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setPedidoTime(`${h}:${m}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Autocompletar datos al seleccionar cliente
  useEffect(() => {
    const c = clients.find(c => c.code === clientCode);
    if (c) {
      setClientData(c);
    } else {
      setClientData({ razonSocial: '', direccion: '', telefono: '', empresa: '', observaciones: '', cuit: '', localidad: '', provincia: '' });
    }
  }, [clientCode, clients]);

  // Manejo de items
  const addItem = () => setItems([...items, { code: '', cantidad: '', diferencia: '', descripcion: '', precio: '' }]);
  const updateItem = (i, field, val) => {
    const arr = [...items]; arr[i][field] = val; setItems(arr);
  };

// Dentro de Home(), antes del return(...)
const generatePdf = async () => {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pedidoNumber,
        pedidoTime,
        clientData,
        dispatchData,
        items,
        vendorCode,
        tipoDescarga
      })
    })
    if (!res.ok) throw new Error()
    const { fileId } = await res.json()
    alert(`PDF subido con éxito (fileId: ${fileId})`)
  } catch {
    alert('Error al generar o subir el PDF')
  }
}

  // Validación de completitud
  const allFilled =
    pedidoNumber &&
    pedidoTime &&
    clientCode &&
    Object.values(clientData).every(v => v) &&
    Object.values(dispatchData).every(v => v) &&
    items.every(it => it.code && it.cantidad) &&
    vendorCode &&
    tipoDescarga;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>HIMETAL PEDIDOS</h1>

      {/* Sector 1: Pedido y Cliente */}
      <section className={styles.section}>
        <h2>PEDIDO HIMETAL</h2>
        <div className={styles.grid4}>
          <label>
            Nº Pedido
            <input value={pedidoNumber} onChange={e => setPedidoNumber(e.target.value)} />
          </label>
          <label>
            Hora
            <input type="time" value={pedidoTime} onChange={e => setPedidoTime(e.target.value)} />
          </label>
          <label>
            Cliente
            <select value={clientCode} onChange={e => setClientCode(e.target.value)}>
              <option value="">--Selecciona Cliente--</option>
              {clients.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} – {c.razonSocial}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.grid4}>
          <label>Razón Social<input value={clientData.razonSocial} readOnly /></label>
          <label>Dirección<input value={clientData.direccion} readOnly /></label>
          <label>Teléfono<input value={clientData.telefono} readOnly /></label>
          <label>Empresa<input value={clientData.empresa} readOnly /></label>
          <label>
            Observaciones
            <input
              value={clientData.observaciones}
              onChange={e => setClientData({ ...clientData, observaciones: e.target.value })}
            />
          </label>
          <label>CUIT<input value={clientData.cuit} readOnly /></label>
          <label>Localidad<input value={clientData.localidad} readOnly /></label>
          <label>Provincia<input value={clientData.provincia} readOnly /></label>
        </div>
        <h3>Datos de Despacho</h3>
        <div className={styles.grid3}>
          <label>
            Dirección
            <input
              value={dispatchData.direccion}
              onChange={e => setDispatchData({ ...dispatchData, direccion: e.target.value })}
            />
          </label>
          <label>
            Contacto
            <input
              value={dispatchData.contactName}
              onChange={e => setDispatchData({ ...dispatchData, contactName: e.target.value })}
            />
          </label>
          <label>
            Teléfono
            <input
              value={dispatchData.contactPhone}
              onChange={e => setDispatchData({ ...dispatchData, contactPhone: e.target.value })}
            />
          </label>
        </div>
      </section>

      {/* Sector 2: Materia Prima */}
      <section className={styles.section}>
        <h2>Códigos de Materia Prima</h2>
        {items.map((it, i) => (
          <div key={i} className={styles.grid5}>
            <select
              value={it.code}
              onChange={e => {
                const code = e.target.value;
                updateItem(i, 'code', code);
                const rm = rawMaterials.find(r => r.code === code);
                updateItem(i, 'descripcion', rm ? rm.description : '');
                updateItem(i, 'precio', rm ? rm.price : '');
              }}
            >
              <option value="">--Selecciona Código--</option>
              {rawMaterials.map(rm => (
                <option key={rm.code} value={rm.code}>
                  {rm.code} – {rm.description}
                </option>
              ))}
            </select>
            <input placeholder="Cantidad" value={it.cantidad} onChange={e => updateItem(i, 'cantidad', e.target.value)} />
            <input placeholder="% Diferencia" value={it.diferencia} onChange={e => updateItem(i, 'diferencia', e.target.value)} />
            <input placeholder="Descripción" value={it.descripcion} readOnly />
            <input placeholder="Precio por kilo" value={it.precio} readOnly />
          </div>
        ))}
        <button onClick={addItem}>Agregar código</button>
      </section>

      {/* Sector 3: Entrega */}
      <section className={styles.section}>
        <h2>Entrega</h2>
        <div className={styles.grid3}>
          <label>
            Vendedor
            <select value={vendorCode} onChange={e => setVendorCode(e.target.value)}>
              <option value="">--Selecciona Vendedor--</option>
              {vendors.map(v => (
                <option key={v.code} value={v.code}>
                  {v.code} – {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>Tipo de Descarga<input value={tipoDescarga} onChange={e => setTipoDescarga(e.target.value)} /></label>
        </div>
      </section>

      {/* Banner de estado */}
      <div className={allFilled ? styles.complete : styles.incomplete}>
        {allFilled ? 'COMPLETO' : 'INCOMPLETO'}
      </div>

{/* Botón para generar PDF y subir a Drive */}
<button
  className={styles.generateBtn}
  disabled={!allFilled}
  onClick={generatePdf}
>
  Generar PDF y subir a Drive
</button>

      {/* Sector 4: Constancia de Envío */}
<section className={styles.section}>
        <h2>Constancia de Envío</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Item</th>
                <th>Cantidad</th>
                <th>Descripción</th>
                <th>Kg</th>
                <th>Descarga</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{pedidoNumber}</td>
                  <td>{pedidoTime}</td>
                  <td>{clientData.razonSocial}</td>
                  <td>{i + 1}</td>
                  <td>{it.cantidad}</td>
                  <td>{it.descripcion}</td>
                  <td>{it.precio}</td>
                  <td>{tipoDescarga}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
