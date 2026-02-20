import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Clock, User, Scissors } from "lucide-react";
import DateSelector from "@/components/DateSelector";
import TimeSlotSelector from "@/components/TimeSlotSelector";

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [establishmentId, setestablishmentId] = useState("1");
  const [serviceId, setServiceId] = useState("1");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingMode, setBookingMode] = useState<"scheduled" | "queue">("scheduled");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const establishments = [
    { id: "1", name: "Estabelecimento do João" },
    { id: "2", name: "Corte & Estilo" },
  ];

  const services = [
    { id: "1", name: "Corte de Cabelo", duration: 30, price: 50 },
    { id: "2", name: "Barba", duration: 20, price: 35 },
    { id: "3", name: "Corte + Barba", duration: 50, price: 80 },
    { id: "4", name: "Pigmentação", duration: 45, price: 60 },
  ];

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setLoadingSlots(true);

    setTimeout(() => {
      const mockSlots: TimeSlot[] = [
        { startTime: "09:00", endTime: "09:30", available: true },
        { startTime: "09:30", endTime: "10:00", available: true },
        { startTime: "10:00", endTime: "10:30", available: false },
        { startTime: "10:30", endTime: "11:00", available: true },
        { startTime: "11:00", endTime: "11:30", available: false },
        { startTime: "11:30", endTime: "12:00", available: true },
        { startTime: "12:00", endTime: "12:30", available: false },
        { startTime: "12:30", endTime: "13:00", available: false },
        { startTime: "13:00", endTime: "13:30", available: true },
        { startTime: "13:30", endTime: "14:00", available: true },
        { startTime: "14:00", endTime: "14:30", available: false },
        { startTime: "14:30", endTime: "15:00", available: true },
        { startTime: "15:00", endTime: "15:30", available: true },
        { startTime: "15:30", endTime: "16:00", available: false },
        { startTime: "16:00", endTime: "16:30", available: true },
        { startTime: "16:30", endTime: "17:00", available: true },
      ];
      setTimeSlots(mockSlots);
      setLoadingSlots(false);
    }, 800);
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      toast.error("Por favor, digite seu nome");
      return;
    }

    if (!clientPhone.trim()) {
      toast.error("Por favor, digite seu telefone");
      return;
    }

    if (bookingMode === "scheduled" && !selectedTime) {
      toast.error("Por favor, selecione um horário");
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      toast.success("Agendamento realizado com sucesso!");

      setCurrentStep(1);
      setestablishmentId("1");
      setServiceId("1");
      setSelectedDate(null);
      setSelectedTime(null);
      setClientName("");
      setClientPhone("");
      setBookingMode("scheduled");
      setTimeSlots([]);
    }, 1500);
  };

  const canProceedToStep2 = establishmentId && serviceId && bookingMode;
  const canProceedToStep3 = canProceedToStep2 && selectedDate;
  const canProceedToStep4 = bookingMode === "queue" || (bookingMode === "scheduled" && selectedTime);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedEstablishment = establishments.find((b) => b.id === establishmentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Agende seu Corte</h1>
          <p className="text-lg text-slate-600">Escolha a data e horário que melhor se adequa a você</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => step < currentStep && setCurrentStep(step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step === currentStep
                      ? "bg-blue-600 text-white shadow-lg"
                      : step < currentStep
                        ? "bg-green-600 text-white cursor-pointer"
                        : "bg-slate-200 text-slate-600"
                    }`}
                >
                  {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </button>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${step < currentStep ? "bg-green-600" : "bg-slate-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Serviço</span>
            <span>Data</span>
            <span>Horário</span>
            <span>Confirmação</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Escolha o Serviço
              </CardTitle>
              <CardDescription>Selecione o tipo de serviço desejado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barbershop">Estabelecimento *</Label>
                <Select value={establishmentId} onValueChange={setestablishmentId}>
                  <SelectTrigger id="barbershop">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Serviço *</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger id="service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {service.duration}min - R${service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Agendamento *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBookingMode("scheduled")}
                    className={`p-4 rounded-lg border-2 transition-all ${bookingMode === "scheduled"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Horário Marcado</p>
                    <p className="text-xs text-slate-600 mt-1">Escolha um horário específico</p>
                  </button>
                  <button
                    onClick={() => setBookingMode("queue")}
                    className={`p-4 rounded-lg border-2 transition-all ${bookingMode === "queue"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                  >
                    <User className="w-5 h-5 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Fila Virtual</p>
                    <p className="text-xs text-slate-600 mt-1">Entre na fila de espera</p>
                  </button>
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              minDate={new Date()}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && bookingMode === "scheduled" && (
          <div className="space-y-4">
            <TimeSlotSelector
              date={selectedDate!}
              slots={timeSlots}
              selectedSlot={selectedTime}
              onSelectSlot={setSelectedTime}
              isLoading={loadingSlots}
              establishmentId={parseInt(establishmentId)}
              durationMinutes={selectedService?.duration || 60}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!selectedTime}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && bookingMode === "queue" && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-blue-900">
                  Você escolheu a <strong>Fila Virtual</strong>. Vamos para a confirmação dos dados.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

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
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Estabelecimento:</span>
                  <span className="font-semibold">{selectedEstablishment?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Serviço:</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                {bookingMode === "scheduled" && selectedDate && selectedTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Data:</span>
                      <span className="font-semibold">
                        {selectedDate.toLocaleDateString("pt-BR")}
                      </span>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome *</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Seu Telefone (WhatsApp) *</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Confirmando..." : "Confirmar Agendamento"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="w-full"
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
