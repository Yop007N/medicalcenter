/**
 * Test Data Fixtures for E2E Tests
 * Contains reusable test data for Medical Services application
 */

export const TestUsers = {
  admin: {
    email: 'admin@medical.com',
    password: 'admin123',
    role: 'admin'
  },
  professional: {
    email: 'doctor@medical.com',
    password: 'doctor123',
    role: 'professional'
  },
  patient: {
    email: 'patient@medical.com',
    password: 'patient123',
    role: 'patient'
  },
  newUser: {
    email: `testuser_${Date.now()}@medical.com`,
    password: 'TestUser123!',
    role: 'patient'
  }
};

export const TestPatients = {
  validPatient: {
    firstName: 'Juan',
    lastName: 'García',
    email: 'juan.garcia@test.com',
    phone: '+54 11 1234-5678',
    dni: '12345678',
    birthDate: '1990-05-15',
    address: 'Av. Corrientes 1234, CABA',
    gender: 'male',
    bloodType: 'A+',
    allergies: 'Penicilina',
    notes: 'Paciente de prueba para E2E tests'
  },
  minimalPatient: {
    firstName: 'María',
    lastName: 'López',
    email: 'maria.lopez@test.com',
    phone: '+54 11 8765-4321'
  },
  updatePatient: {
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@test.com',
    phone: '+54 11 5555-5555'
  }
};

export const TestAppointments = {
  validAppointment: {
    date: getFutureDate(7), // 7 days from now
    time: '10:00',
    duration: 30,
    type: 'consultation',
    reason: 'Consulta general',
    notes: 'Primera consulta del paciente'
  },
  urgentAppointment: {
    date: getFutureDate(1), // Tomorrow
    time: '09:00',
    duration: 45,
    type: 'urgent',
    reason: 'Dolor de cabeza intenso',
    notes: 'Requiere atención urgente'
  },
  followUpAppointment: {
    date: getFutureDate(14), // 2 weeks from now
    time: '14:30',
    duration: 20,
    type: 'follow-up',
    reason: 'Seguimiento de tratamiento',
    notes: 'Revisión de resultados'
  }
};

export const TestMedicalRecords = {
  consultation: {
    type: 'consultation',
    diagnosis: 'Gripe estacional',
    symptoms: 'Fiebre, dolor muscular, tos',
    treatment: 'Reposo, hidratación, paracetamol 500mg cada 8 horas',
    notes: 'Evolución favorable esperada en 5-7 días'
  },
  labResults: {
    type: 'lab_results',
    testName: 'Hemograma completo',
    results: 'Valores dentro de parámetros normales',
    notes: 'Sin anomalías detectadas'
  }
};

export const InvalidData = {
  emptyEmail: '',
  invalidEmail: 'invalid-email',
  shortPassword: '123',
  mismatchPassword: 'DifferentPassword123!',
  invalidPhone: '123',
  futureBirthDate: getFutureDate(365),
  pastAppointmentDate: getPastDate(7)
};

// Helper functions
function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getPastDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@medicalservices.test`;
}

export function generateUniqueDNI(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
