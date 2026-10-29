const clients = new Map();

export const addEventStreamClient = (userId, response) => {
  const userClients = clients.get(userId) || new Set();
  userClients.add(response);
  clients.set(userId, userClients);
};

export const removeEventStreamClient = (userId, response) => {
  const userClients = clients.get(userId);
  if (!userClients) return;

  userClients.delete(response);
  if (userClients.size === 0) {
    clients.delete(userId);
  }
};

export const sendEventToUser = (userId, event) => {
  const userClients = clients.get(String(userId));
  if (!userClients) return;

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const response of userClients) {
    if (response.writableEnded || response.destroyed) {
      userClients.delete(response);
      continue;
    }

    response.write(payload);
  }

  if (userClients.size === 0) {
    clients.delete(String(userId));
  }
};

export const broadcastEvent = (event) => {
  for (const userId of clients.keys()) {
    sendEventToUser(userId, event);
  }
};
