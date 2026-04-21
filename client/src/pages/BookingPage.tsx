import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Clock, User, Calendar, Loader2 } from "lucide-react";
import DateSelector from "@/components/DateSelector";
import TimeSlotSelector from "@/components/TimeSlotSelector";
import { trpc } from "@/lib/trpc";

export default function BookingPage() {
  const params = new URLSearchParams(window.location.search);
  const establishmentIdParam = parseInt(params.get("establishment") || "0");

  const [currentStep, setCurrentStep] = useState(1);
  const [serviceId, setServiceId] = useState<string>("");
  const [barberId, setBarberId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingMode, setBookingMode] = useState<"scheduled" | "queue">("scheduled");
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ appointmentId: number; queuePosition?: number } | null>(null);

  const { data: establishment, isLoading: loadingEstablishment, error: establishmentError } =
    trpc.establishment.getPublic.useQuery(
      { id: establishmentIdParam },
      { enabled: establishmentIdParam > 0, retry: false }
    );

  const { data: servicesList = [] } = trpc.services.listPublic.useQuery(
    { establishmentId: establishmentIdParam },
    { enabled: establishmentIdParam > 0 }
  );

  const { data: barbersList = [] } = trpc.barbers.listPublic.useQuery(
    { establishmentId: establishmentIdParam },
    { enabled: establishmentIdParam > 0 }
  );

  const selectedService = servicesList.find(s => s.id === parseInt(serviceId));
  const durationMinutes = selectedService?.durationMinutes ?? 30;

  const { data: slots = [], isLoading: loadingSlots } = trpc.appointments.getAvailableSlotsPublic.useQuery(
    {
      establishmentId: establishmentIdParam,
      date: selectedDate!,
      barberId: barberId ? parseInt(barberId) : undefined,
      slotDurationMinutes: durationMinutes,
    },
    { enabled: !!selectedDate && currentStep === 3 && bookingMode === "scheduled" }
  );

  const bookMutation = trpc.appointments.bookPublic.useMutation({
    onSuccess: (data) => {
      setBookingResult({ appointmentId: data.appointmentId, queuePosition: data.queuePosition });
      setBookingDone(true);
      setSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao realizar agendamento");
      setSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!clientName.trim()) { toast.error("Por favor, informe seu nome"); return; }
    if (!clientPhone.trim()) { toast.error("Por favor, informe seu telefone"); return; }
    if (bookingMode === "scheduled" && !selectedTime) { toast.error("Selecione um horário"); return; }

    setSubmitting(true);

    let scheduledTime: Date | undefined;
    if (bookingMode === "scheduled" && selectedDate && selectedTime) {
      const [h, m] = selectedTime.split(":").map(Number);
      scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(h, m, 0, 0);
    }

    bookMutation.mutate({
      establishmentId: establishmentIdParam,
      serviceId: parseInt(serviceId),
      barberId: barberId ? parseInt(barberId) : undefined,
      clientName,
      clientPhone,
      scheduledTime,
      bookingMode,
    });
  };

  if (!establishmentIdParam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Link de agendamento inválido. Verifique com o estabelecimento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingEstablishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (establishmentError || !establishment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Estabelecimento não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingDone && bookingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground">{establishment.name}</p>
            {bookingResult.queuePosition && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-700 font-semibold">Sua posição na fila: #{bookingResult.queuePosition}</p>
              </div>
            )}
            {bookingMode === "scheduled" && selectedDate && selectedTime && (
              <div className="bg-green-50 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Data:</span> <strong>{selectedDate.toLocaleDateString("pt-BR")}</strong></p>
                <p className="text-sm"><span className="text-muted-foreground">Horário:</span> <strong>{selectedTime}</strong></p>
                <p className="text-sm"><span className="text-muted-foreground">Serviço:</span> <strong>{selectedService?.name}</strong></p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Você receberá uma confirmação via WhatsApp em breve.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canProceedToStep2 = serviceId && bookingMode;
  const canProceedToStep3 = canProceedToStep2 && selectedDate;

  const operatingMode = establishment.operatingMode ?? "both";
  const showQueue = operatingMode === "queue" || operatingMode === "both";
  const showScheduled = operatingMode === "scheduled" || operatingMode === "both";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{establishment.name}</h1>
          <p className="text-lg text-slate-600">
            {establishment.description || "Agende seu horário online"}
          </p>
          {establishment.city && (
            <p className="text-sm text-slate-500 mt-1">{establishment.city}{establishment.state ? `, ${establishment.state}` : ""}</p>
          )}
        </div>

        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <button
                  onClick={() => step < currentStep && setCurrentStep(step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step === currentStep ? "bg-blue-600 text-white shadow-lg" :
                    step < currentStep ? "bg-green-600 text-white cursor-pointer" :
                    "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </button>
                {step < 4 && <div className={`h-1 flex-1 mx-2 ${step < currentStep ? "bg-green-600" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-600 px-1">
            <span>Serviço</span>
            <span>Data</span>
            <span>Horário</span>
            <span>Confirmação</span>
          </div>
        </div>

        {/* Step 1: Service + mode */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha o Serviço</CardTitle>
              <CardDescription>Selecione o serviço desejado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Serviço *</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesList.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} — {s.durationMinutes}min — R$ {Number(s.price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {barbersList.length > 0 && (
                <div className="space-y-2">
                  <Label>Profissional (opcional)</Label>
                  <Select value={barberId} onValueChange={setBarberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer profissional</SelectItem>
                      {barbersList.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(showQueue || showScheduled) && (
                <div className="space-y-2">
                  <Label>Tipo de Agendamento *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {showScheduled && (
                      <button
                        onClick={() => setBookingMode("scheduled")}
                        className={`p-4 rounded-lg border-2 transition-all ${bookingMode === "scheduled" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Horário Marcado</p>
                        <p className="text-xs text-slate-600 mt-1">Escolha um horário</p>
                      </button>
                    )}
                    {showQueue && (
                      <button
                        onClick={() => setBookingMode("queue")}
                        className={`p-4 rounded-lg border-2 transition-all ${bookingMode === "queue" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
                      >
                        <User className="w-5 h-5 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Fila Virtual</p>
                        <p className="text-xs text-slate-600 mt-1">Entre na fila de espera</p>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={() => setCurrentStep(2)} disabled={!canProceedToStep2} className="w-full bg-blue-600 hover:bg-blue-700">
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Date */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={(date) => { setSelectedDate(date); setSelectedTime(null); }}
              minDate={new Date()}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">Voltar</Button>
              <Button onClick={() => setCurrentStep(3)} disabled={!canProceedToStep3} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Time slot or queue confirmation */}
        {currentStep === 3 && bookingMode === "scheduled" && (
          <div className="space-y-4">
            <TimeSlotSelector
              date={selectedDate!}
              slots={slots}
              selectedSlot={selectedTime}
              onSelectSlot={setSelectedTime}
              isLoading={loadingSlots}
              establishmentId={establishmentIdParam}
              durationMinutes={durationMinutes}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">Voltar</Button>
              <Button onClick={() => setCurrentStep(4)} disabled={!selectedTime} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && bookingMode === "queue" && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-blue-900">Você escolheu a <strong>Fila Virtual</strong>. Continue para confirmar seus dados.</p>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">Voltar</Button>
              <Button onClick={() => setCurrentStep(4)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Confirme seus Dados
              </CardTitle>
              <CardDescription>Revise as informações antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Serviço:</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                {barberId && barbersList.find(b => b.id === parseInt(barberId)) && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Profissional:</span>
                    <span className="font-semibold">{barbersList.find(b => b.id === parseInt(barberId))?.name}</span>
                  </div>
                )}
                {bookingMode === "scheduled" && selectedDate && selectedTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Data:</span>
                      <span className="font-semibold">{selectedDate.toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Horário:</span>
                      <span className="font-semibold">{selectedTime}</span>
                    </div>
                  </>
                )}
                {bookingMode === "queue" && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tipo:</span>
                    <span className="font-semibold">Fila Virtual</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor:</span>
                  <span className="font-semibold">R$ {Number(selectedService?.price ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome *</Label>
                <Input id="name" placeholder="Nome completo" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Seu WhatsApp *</Label>
                <Input id="phone" placeholder="(11) 99999-9999" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-green-600 hover:bg-green-700">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirmando...</> : "Confirmar Agendamento"}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(3)} className="w-full">Voltar</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
