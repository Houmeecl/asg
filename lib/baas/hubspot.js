/**
 * HubSpot CRM — leads desde /contacto.
 * Auth: Private App token (CRM contacts + notes).
 * Sin token → modo simulator (no sale a HubSpot).
 */

const API = 'https://api.hubapi.com';

function cfg() {
  const token =
    process.env.HUBSPOT_PRIVATE_APP_TOKEN ||
    process.env.HUBSPOT_ACCESS_TOKEN ||
    '';
  return {
    token,
    mode: token ? 'live' : 'simulator',
    pipeline: process.env.HUBSPOT_PIPELINE || 'default',
    leadStatus: process.env.HUBSPOT_LEAD_STATUS || 'NEW',
  };
}

export function getHubspotStatus() {
  const { mode, pipeline, leadStatus } = cfg();
  return {
    mode,
    configured: mode === 'live',
    pipeline,
    leadStatus,
  };
}

const simLeads = [];

export function getHubspotSimulatorState() {
  return { mode: cfg().mode, leads: [...simLeads].slice(-30).reverse() };
}

function splitName(nombre) {
  const parts = String(nombre || '').trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: '' };
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

async function hsFetch(path, { method = 'GET', body } = {}) {
  const { token } = cfg();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg = json?.message || json?.raw || text || res.statusText;
    throw new Error(`HubSpot ${res.status}: ${msg}`);
  }
  return json;
}

async function findContactByEmail(email) {
  const data = await hsFetch('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: {
      filterGroups: [
        {
          filters: [{ propertyName: 'email', operator: 'EQ', value: email }],
        },
      ],
      properties: ['email', 'firstname', 'lastname', 'hs_lead_status'],
      limit: 1,
    },
  });
  return data?.results?.[0] || null;
}

async function createNote(contactId, mensaje, nombre) {
  // associationTypeId 202 = note → contact (HUBSPOT_DEFINED)
  return hsFetch('/crm/v3/objects/notes', {
    method: 'POST',
    body: {
      properties: {
        hs_timestamp: Date.now().toString(),
        hs_note_body: `Contacto web sicr3p/\nDe: ${nombre}\n\n${mensaje}`,
      },
      associations: [
        {
          to: { id: String(contactId) },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
        },
      ],
    },
  });
}

/**
 * Upsert contacto + nota con el mensaje del formulario.
 * @returns {{ mode, contactId, created, noteId? }}
 */
export async function upsertContactLead({ nombre, email, mensaje, telefono }) {
  const { mode, leadStatus } = cfg();
  const { firstname, lastname } = splitName(nombre);

  if (mode === 'simulator') {
    const lead = {
      id: `HS-SIM-${Date.now()}`,
      email,
      firstname,
      lastname,
      mensaje,
      createdAt: new Date().toISOString(),
    };
    simLeads.push(lead);
    return { mode, contactId: lead.id, created: true, noteId: null, simulator: true };
  }

  const existing = await findContactByEmail(email);
  const properties = {
    email,
    firstname,
    lastname: lastname || undefined,
    hs_lead_status: leadStatus,
    lifecyclestage: 'lead',
  };
  if (telefono) properties.phone = telefono;

  let contact;
  let created = false;
  if (existing) {
    contact = await hsFetch(`/crm/v3/objects/contacts/${existing.id}`, {
      method: 'PATCH',
      body: { properties },
    });
  } else {
    contact = await hsFetch('/crm/v3/objects/contacts', {
      method: 'POST',
      body: { properties },
    });
    created = true;
  }

  let note = null;
  try {
    note = await createNote(contact.id, mensaje, nombre);
  } catch (err) {
    console.warn('[hubspot] nota no creada:', err.message);
  }

  return {
    mode,
    contactId: contact.id,
    created,
    noteId: note?.id || null,
    simulator: false,
  };
}
