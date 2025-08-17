const API_BASE_URL = 'http://localhost:3001';

export interface SubscriptionData {
  email: string;
  category: string;
  region: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
}

export const subscribeToNewsletter = async (subscriptionData: SubscriptionData): Promise<SubscriptionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la suscripción');
    }

    return data;
  } catch (error) {
    console.error('Error en suscripción:', error);
    throw error;
  }
}; 