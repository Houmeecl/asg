'use client';

import { useState } from 'react';

const PRODUCTOS = [
  { id: 'pelota', nombre: 'Pelota', emoji: '⚽', precio: 3990 },
  { id: 'muneco', nombre: 'Muñeco', emoji: '🧸', precio: 5990 },
  { id: 'auto', nombre: 'Auto de juguete', emoji: '🚗', precio: 4500 },
  { id: 'cuento', nombre: 'Libro de cuentos', emoji: '📚', precio: 6990 },
  { id: 'bloques', nombre: 'Bloques', emoji: '🧱', precio: 7990 },
  { id: 'peluche', nombre: 'Peluche', emoji: '🐻', precio: 8990 },
  { id: 'pinturas', nombre: 'Pinturas', emoji: '🎨', precio: 3500 },
  { id: 'puzzle', nombre: 'Rompecabezas', emoji: '🧩', precio: 4990 },
  { id: 'lapices', nombre: 'Lápices de colores', emoji: '✏️', precio: 1200 },
  { id: 'cuaderno', nombre: 'Cuaderno', emoji: '📓', precio: 1500 },
];

const BILLETES = [20000, 10000, 5000, 2000, 1000];
const MONEDAS = [500, 100, 50, 10];
const DENOMINACIONES = [...BILLETES, ...MONEDAS];

const formatoCLP = (monto) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);

// Entrega el vuelto con la menor cantidad de billetes y monedas posible.
function desglosarVuelto(monto) {
  let restante = monto;
  const piezas = [];
  for (const valor of DENOMINACIONES) {
    const cantidad = Math.floor(restante / valor);
    if (cantidad > 0) {
      piezas.push({ valor, cantidad });
      restante -= cantidad * valor;
    }
  }
  return piezas;
}

function BotonDinero({ valor, tipo, disabled, onClick }) {
  const estilo =
    tipo === 'billete'
      ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
      : 'bg-amber-100 border-amber-400 text-amber-900';
  return (
    <button
      type="button"
      onClick={() => onClick(valor)}
      disabled={disabled}
      aria-label={`Recibir ${formatoCLP(valor)}`}
      className={`rounded-xl border-2 px-2 py-3 text-sm font-bold shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${estilo}`}
    >
      {formatoCLP(valor)}
    </button>
  );
}

export default function TiendaInfantil() {
  const [carrito, setCarrito] = useState({});
  const [recibido, setRecibido] = useState(0);
  const [numeroVenta, setNumeroVenta] = useState(1);
  const [boleta, setBoleta] = useState(null);

  const items = PRODUCTOS.filter((p) => carrito[p.id] > 0).map((p) => ({
    ...p,
    cantidad: carrito[p.id],
    subtotal: p.precio * carrito[p.id],
  }));
  const total = items.reduce((suma, i) => suma + i.subtotal, 0);
  const faltante = Math.max(total - recibido, 0);
  const vuelto = Math.max(recibido - total, 0);
  const sePuedeCobrar = total > 0 && recibido >= total;

  function cambiarCantidad(id, delta) {
    setCarrito((actual) => ({ ...actual, [id]: Math.max((actual[id] || 0) + delta, 0) }));
  }

  function vaciarCarrito() {
    setCarrito({});
    setRecibido(0);
  }

  function cobrar() {
    setBoleta({
      numero: numeroVenta,
      items,
      total,
      recibido,
      vuelto,
      piezas: desglosarVuelto(vuelto),
      fecha: new Date().toLocaleString('es-CL'),
    });
  }

  function nuevaVenta() {
    setCarrito({});
    setRecibido(0);
    setBoleta(null);
    setNumeroVenta((n) => n + 1);
  }

  let mensajeCaja;
  if (total === 0) {
    mensajeCaja = 'Agrega juguetes al carrito 🛒';
  } else if (faltante > 0) {
    mensajeCaja = `Faltan ${formatoCLP(faltante)} 🤔`;
  } else if (vuelto > 0) {
    mensajeCaja = `Vuelto: ${formatoCLP(vuelto)} 🪙`;
  } else {
    mensajeCaja = '¡Pago exacto! ✅';
  }

  return (
    <main className="min-h-screen bg-amber-50 p-4 text-stone-800 sm:p-6">
      <header className="mx-auto mb-6 max-w-6xl">
        <h1 className="text-3xl font-extrabold text-violet-700 sm:text-4xl">
          🛒 Tienda de Juguetes
        </h1>
        <p className="text-stone-600">Elige juguetes y cobra en la caja.</p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-label="Productos" className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {PRODUCTOS.map((p) => {
            const cantidad = carrito[p.id] || 0;
            return (
              <article
                key={p.id}
                className="flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-stone-200"
              >
                <span className="text-5xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <h2 className="mt-2 font-bold">{p.nombre}</h2>
                <p className="text-violet-700 font-semibold">{formatoCLP(p.precio)}</p>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(p.id, -1)}
                    disabled={cantidad === 0}
                    aria-label={`Quitar ${p.nombre}`}
                    className="h-10 w-10 rounded-full bg-stone-200 text-xl font-bold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-lg font-bold" aria-live="polite">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(p.id, 1)}
                    aria-label={`Agregar ${p.nombre}`}
                    className="h-10 w-10 rounded-full bg-emerald-500 text-xl font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <aside
          aria-label="Caja"
          className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-stone-200 lg:sticky lg:top-4 lg:self-start"
        >
          <h2 className="text-2xl font-extrabold text-violet-700">💰 Caja</h2>

          <div className="mt-4 min-h-16 space-y-1 rounded-xl bg-stone-50 p-3 text-sm">
            {items.length === 0 && <p className="text-stone-500">Carrito vacío</p>}
            {items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span>
                  {i.cantidad} × {i.nombre}
                </span>
                <span className="font-semibold">{formatoCLP(i.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xl font-extrabold">
            <span>Total</span>
            <span>{formatoCLP(total)}</span>
          </div>

          <div className="mt-4 rounded-xl bg-violet-50 p-3">
            <div className="flex justify-between text-sm">
              <span>Dinero recibido</span>
              <span className="font-bold">{formatoCLP(recibido)}</span>
            </div>
            <p className="mt-2 text-center text-lg font-bold text-violet-800" aria-live="polite">
              {mensajeCaja}
            </p>
            {sePuedeCobrar && vuelto > 0 && (
              <p className="mt-1 text-center text-xs text-stone-600">
                {desglosarVuelto(vuelto)
                  .map((p) => `${p.cantidad} × ${formatoCLP(p.valor)}`)
                  .join('  ·  ')}
              </p>
            )}
          </div>

          <p className="mt-4 text-sm font-semibold text-stone-600">Toca el dinero que entregas:</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {BILLETES.map((valor) => (
              <BotonDinero
                key={valor}
                valor={valor}
                tipo="billete"
                disabled={total === 0}
                onClick={(v) => setRecibido((r) => r + v)}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {MONEDAS.map((valor) => (
              <BotonDinero
                key={valor}
                valor={valor}
                tipo="moneda"
                disabled={total === 0}
                onClick={(v) => setRecibido((r) => r + v)}
              />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRecibido(0)}
              disabled={recibido === 0}
              className="rounded-xl bg-stone-200 py-3 font-bold disabled:opacity-40"
            >
              Borrar pago
            </button>
            <button
              type="button"
              onClick={vaciarCarrito}
              disabled={items.length === 0}
              className="rounded-xl bg-stone-200 py-3 font-bold disabled:opacity-40"
            >
              Vaciar carrito
            </button>
          </div>
          <button
            type="button"
            onClick={cobrar}
            disabled={!sePuedeCobrar}
            className="mt-2 w-full rounded-xl bg-emerald-600 py-4 text-lg font-extrabold text-white shadow disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cobrar 🧾
          </button>
        </aside>
      </div>

      {boleta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Boleta"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 font-mono text-sm shadow-xl">
            <h2 className="text-center font-sans text-lg font-extrabold">
              🧾 Boleta N° {boleta.numero}
            </h2>
            <p className="text-center text-xs text-stone-500">{boleta.fecha}</p>

            <ul className="my-4 space-y-1 border-y border-dashed py-3">
              {boleta.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>
                    {i.cantidad} × {i.nombre}
                  </span>
                  <span>{formatoCLP(i.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatoCLP(boleta.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Recibido</span>
              <span>{formatoCLP(boleta.recibido)}</span>
            </div>
            <div className="flex justify-between">
              <span>Vuelto</span>
              <span>{formatoCLP(boleta.vuelto)}</span>
            </div>

            {boleta.piezas.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3">
                <p className="mb-1 font-semibold">Vuelto en:</p>
                <ul>
                  {boleta.piezas.map((p) => (
                    <li key={p.valor}>
                      {p.cantidad} × {formatoCLP(p.valor)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-center font-sans font-bold text-violet-700">
              ¡Gracias por tu compra! 🎉
            </p>
            <button
              type="button"
              onClick={nuevaVenta}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-sans font-bold text-white"
            >
              ¡Nueva compra!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
