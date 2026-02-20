# BarberFlow SaaS - Documentação de API

## Visão Geral

BarberFlow é uma plataforma SaaS completa para gerenciamento de barbearias, oferecendo agendamentos, filas virtuais, integração com WhatsApp e Google Calendar.

## Autenticação

Todas as rotas protegidas requerem autenticação via OAuth Manus. O token de sessão é armazenado em um cookie HTTP-only.

### Login
```
GET /api/oauth/callback?code=<authorization_code>
```

### Logout
```
POST /api/trpc/auth.logout
```

## Endpoints tRPC

### Autenticação

#### `auth.me`
Obter informações do usuário autenticado.
```typescript
const user = await trpc.auth.me.useQuery();
```

**Resposta:**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "admin",
  "createdAt": "2026-02-03T00:00:00Z"
}
```

### Barbearias

#### `barbershop.list`
Listar todas as barbearias do usuário.
```typescript
const barbershops = await trpc.barbershop.list.useQuery();
```

#### `barbershop.get`
Obter detalhes de uma barbearia específica.
```typescript
const barbershop = await trpc.barbershop.get.useQuery({ id: 1 });
```

#### `barbershop.create`
Criar uma nova barbearia.
```typescript
const result = await trpc.barbershop.create.useMutation({
  name: "Barbearia do João",
  phone: "(11) 99999-9999",
  whatsapp: "(11) 99999-9999",
  address: "Rua Principal, 123",
  city: "São Paulo",
  state: "SP",
  zipCode: "01310-100",
  description: "Barbearia tradicional",
  openTime: "09:00",
  closeTime: "18:00"
});
```

#### `barbershop.update`
Atualizar informações de uma barbearia.
```typescript
const result = await trpc.barbershop.update.useMutation({
  id: 1,
  name: "Novo Nome",
  operatingMode: "both" // "queue", "scheduled", ou "both"
});
```

### Agendamentos

#### `appointment.list`
Listar agendamentos de uma barbearia.
```typescript
const appointments = await trpc.appointment.list.useQuery({
  barbershopId: 1,
  startDate: new Date("2026-02-01"),
  endDate: new Date("2026-02-28"),
  status: "confirmed" // opcional
});
```

#### `appointment.createScheduled`
Criar um agendamento com horário específico.
```typescript
const result = await trpc.appointment.createScheduled.useMutation({
  barbershopId: 1,
  clientId: 1,
  serviceId: 1,
  scheduledTime: new Date("2026-02-10T14:00:00"),
  durationMinutes: 60,
  notes: "Corte especial"
});
```

#### `appointment.addToQueue`
Adicionar cliente à fila.
```typescript
const result = await trpc.appointment.addToQueue.useMutation({
  barbershopId: 1,
  clientId: 1,
  serviceId: 1,
  notes: "Corte padrão"
});
```

#### `appointment.updateStatus`
Atualizar status de um agendamento.
```typescript
const result = await trpc.appointment.updateStatus.useMutation({
  appointmentId: 1,
  status: "in_progress" // "pending", "confirmed", "in_progress", "completed", "cancelled"
});
```

### Serviços

#### `service.list`
Listar serviços de uma barbearia.
```typescript
const services = await trpc.service.list.useQuery({ barbershopId: 1 });
```

#### `service.create`
Criar um novo serviço.
```typescript
const result = await trpc.service.create.useMutation({
  barbershopId: 1,
  name: "Corte Masculino",
  description: "Corte padrão",
  durationMinutes: 30,
  price: 50.00
});
```

### Barbeiros

#### `barbers.list`
Listar barbeiros de uma barbearia.
```typescript
const barbers = await trpc.barbers.list.useQuery({ barbershopId: 1 });
```

#### `barbers.create`
Criar um novo barbeiro.
```typescript
const result = await trpc.barbers.create.useMutation({
  barbershopId: 1,
  name: "Carlos",
  phone: "(11) 98888-8888",
  email: "carlos@example.com"
});
```

### Pausas e Bloqueios

#### `breaks.list`
Listar pausas de uma barbearia.
```typescript
const breaks = await trpc.breaks.list.useQuery({ barbershopId: 1 });
```

#### `breaks.create`
Criar uma pausa.
```typescript
const result = await trpc.breaks.create.useMutation({
  barbershopId: 1,
  barberId: 1,
  startTime: new Date("2026-02-10T12:00:00"),
  endTime: new Date("2026-02-10T13:00:00"),
  reason: "Almoço"
});
```

### WhatsApp

#### `whatsapp.getSessions`
Listar todas as sessões WhatsApp do usuário.
```typescript
const sessions = await trpc.whatsapp.getSessions.useQuery();
```

#### `whatsapp.createSession`
Criar uma nova sessão WhatsApp.
```typescript
const result = await trpc.whatsapp.createSession.useMutation({
  barbershopId: 1,
  sessionName: "barbearia_principal"
});
```

#### `whatsapp.deleteSession`
Deletar uma sessão WhatsApp.
```typescript
const result = await trpc.whatsapp.deleteSession.useMutation({
  sessionId: 1
});
```

#### `whatsapp.sendMessage`
Enviar uma mensagem WhatsApp.
```typescript
const result = await trpc.whatsapp.sendMessage.useMutation({
  sessionId: 1,
  phoneNumber: "5511999999999",
  message: "Olá! Seu agendamento foi confirmado."
});
```

### Google Calendar

#### `googleCalendar.getIntegration`
Obter integração com Google Calendar.
```typescript
const integration = await trpc.googleCalendar.getIntegration.useQuery({
  barbershopId: 1
});
```

#### `googleCalendar.getSyncedEvents`
Listar eventos sincronizados com Google Calendar.
```typescript
const events = await trpc.googleCalendar.getSyncedEvents.useQuery({
  barbershopId: 1,
  type: "appointment" // "appointment", "break", "timeblock"
});
```

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `UNAUTHORIZED` | Usuário não autenticado |
| `FORBIDDEN` | Usuário não tem permissão |
| `NOT_FOUND` | Recurso não encontrado |
| `CONFLICT` | Conflito (ex: horário indisponível) |
| `BAD_REQUEST` | Dados inválidos |
| `INTERNAL_SERVER_ERROR` | Erro do servidor |

## Rate Limiting

- Limite: 100 requisições por minuto por usuário
- Headers de resposta incluem `X-RateLimit-*`

## Webhooks (Futuro)

Webhooks para eventos importantes:
- `appointment.created`
- `appointment.confirmed`
- `appointment.cancelled`
- `whatsapp.message_sent`
- `whatsapp.message_failed`

## Exemplos de Integração

### React/TypeScript
```typescript
import { trpc } from "@/lib/trpc";

function MyComponent() {
  const { data: barbershops } = trpc.barbershop.list.useQuery();
  const createMutation = trpc.barbershop.create.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: "Nova Barbearia",
        phone: "(11) 99999-9999",
        whatsapp: "(11) 99999-9999"
      });
    } catch (error) {
      console.error("Erro ao criar barbearia:", error);
    }
  };

  return (
    <div>
      {barbershops?.map(shop => (
        <div key={shop.id}>{shop.name}</div>
      ))}
      <button onClick={handleCreate}>Criar</button>
    </div>
  );
}
```

## Suporte

Para dúvidas ou problemas, entre em contato através do formulário de suporte no dashboard.
