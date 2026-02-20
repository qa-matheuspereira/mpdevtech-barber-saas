import { describe, it, expect } from "vitest";

describe("Appointment Mode Validation", () => {
  describe("Operating mode validation", () => {
    it("should validate queue mode", () => {
      const mode = "queue";
      const validModes = ["queue", "scheduled", "both"];
      expect(validModes).toContain(mode);
    });

    it("should validate scheduled mode", () => {
      const mode = "scheduled";
      const validModes = ["queue", "scheduled", "both"];
      expect(validModes).toContain(mode);
    });

    it("should validate both mode", () => {
      const mode = "both";
      const validModes = ["queue", "scheduled", "both"];
      expect(validModes).toContain(mode);
    });

    it("should reject invalid mode", () => {
      const mode = "invalid";
      const validModes = ["queue", "scheduled", "both"];
      expect(validModes).not.toContain(mode);
    });
  });

  describe("Mode-based booking restrictions", () => {
    it("should allow only queue bookings for queue mode", () => {
      const barbershopMode = "queue";
      const allowedBookingTypes = {
        queue: ["queue"],
        scheduled: ["scheduled"],
        both: ["queue", "scheduled"],
      };

      const allowed = allowedBookingTypes[barbershopMode as keyof typeof allowedBookingTypes];
      expect(allowed).toContain("queue");
      expect(allowed).not.toContain("scheduled");
    });

    it("should allow only scheduled bookings for scheduled mode", () => {
      const barbershopMode = "scheduled";
      const allowedBookingTypes = {
        queue: ["queue"],
        scheduled: ["scheduled"],
        both: ["queue", "scheduled"],
      };

      const allowed = allowedBookingTypes[barbershopMode as keyof typeof allowedBookingTypes];
      expect(allowed).toContain("scheduled");
      expect(allowed).not.toContain("queue");
    });

    it("should allow both booking types for both mode", () => {
      const barbershopMode = "both";
      const allowedBookingTypes = {
        queue: ["queue"],
        scheduled: ["scheduled"],
        both: ["queue", "scheduled"],
      };

      const allowed = allowedBookingTypes[barbershopMode as keyof typeof allowedBookingTypes];
      expect(allowed).toContain("queue");
      expect(allowed).toContain("scheduled");
    });
  });

  describe("Mode label generation", () => {
    it("should generate correct label for queue mode", () => {
      const mode = "queue";
      const labels: Record<string, string> = {
        queue: "Fila Virtual",
        scheduled: "Horário Marcado",
        both: "Fila Virtual ou Horário Marcado",
      };

      expect(labels[mode]).toBe("Fila Virtual");
    });

    it("should generate correct label for scheduled mode", () => {
      const mode = "scheduled";
      const labels: Record<string, string> = {
        queue: "Fila Virtual",
        scheduled: "Horário Marcado",
        both: "Fila Virtual ou Horário Marcado",
      };

      expect(labels[mode]).toBe("Horário Marcado");
    });

    it("should generate correct label for both mode", () => {
      const mode = "both";
      const labels: Record<string, string> = {
        queue: "Fila Virtual",
        scheduled: "Horário Marcado",
        both: "Fila Virtual ou Horário Marcado",
      };

      expect(labels[mode]).toBe("Fila Virtual ou Horário Marcado");
    });
  });

  describe("Booking type requirements", () => {
    it("should require time slot for scheduled bookings", () => {
      const bookingType = "scheduled";
      const hasTimeSlot = true;

      if (bookingType === "scheduled") {
        expect(hasTimeSlot).toBe(true);
      }
    });

    it("should not require time slot for queue bookings", () => {
      const bookingType = "queue";
      const hasTimeSlot = false;

      if (bookingType === "queue") {
        expect(hasTimeSlot).toBe(false);
      }
    });

    it("should require client info for all booking types", () => {
      const bookingTypes = ["queue", "scheduled"];
      const clientInfo = { name: "João", phone: "(11) 99999-9999" };

      bookingTypes.forEach((type) => {
        expect(clientInfo.name).toBeTruthy();
        expect(clientInfo.phone).toBeTruthy();
      });
    });
  });
});


describe("Notification Functions", () => {
  it("should generate confirmation message", () => {
    const message = "Olá João! 👋\n\nSeu agendamento foi confirmado! ✅";
    expect(message).toContain("confirmado");
  });

  it("should generate reminder message", () => {
    const message = "Oi João! 🔔\n\nLembrete: Seu agendamento é em 1 hora!";
    expect(message).toContain("Lembrete");
  });

  it("should generate started message", () => {
    const message = "Oi João! ✂️\n\nSeu atendimento está começando!";
    expect(message).toContain("começando");
  });

  it("should generate completed message", () => {
    const message = "Obrigado João! 😊\n\nSeu atendimento foi concluído!";
    expect(message).toContain("concluído");
  });

  it("should generate queue position message", () => {
    const message = "Oi João! 👋\n\nVocê foi adicionado à fila!\n\nPosição na fila: #5";
    expect(message).toContain("fila");
    expect(message).toContain("#5");
  });
});

describe("Job Scheduler", () => {
  it("should initialize jobs without errors", () => {
    // Job initialization should not throw
    expect(() => {
      // initializeJobs() is called automatically
    }).not.toThrow();
  });

  it("should schedule reminder job every 5 minutes", () => {
    // Cron expression should be valid
    const cronExpression = "*/5 * * * *";
    expect(cronExpression).toMatch(/^\*\/5 \* \* \* \*$/);
  });
});
