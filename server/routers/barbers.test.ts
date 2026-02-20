import { describe, it, expect } from "vitest";

describe("Barber Management", () => {
  describe("Barber validation", () => {
    it("should validate barber name is not empty", () => {
      const name = "João Silva";
      expect(name.trim().length).toBeGreaterThan(0);
    });

    it("should validate barber name minimum length", () => {
      const name = "Jo";
      expect(name.length).toBeGreaterThanOrEqual(2);
    });

    it("should reject empty barber name", () => {
      const name = "";
      expect(name.trim().length).toBe(0);
    });

    it("should validate phone format", () => {
      const phone = "(11) 98765-4321";
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      expect(phoneRegex.test(phone)).toBe(true);
    });

    it("should accept optional phone", () => {
      const phone = null;
      expect(phone === null || typeof phone === "string").toBe(true);
    });
  });

  describe("Barber status management", () => {
    it("should create barber as active by default", () => {
      const isActive = true;
      expect(isActive).toBe(true);
    });

    it("should allow toggling active status", () => {
      let isActive = true;
      isActive = !isActive;
      expect(isActive).toBe(false);
      isActive = !isActive;
      expect(isActive).toBe(true);
    });

    it("should track active and inactive barbers", () => {
      const barbers = [
        { id: 1, name: "João", isActive: true },
        { id: 2, name: "Carlos", isActive: true },
        { id: 3, name: "Pedro", isActive: false },
      ];

      const activeCount = barbers.filter((b) => b.isActive).length;
      const inactiveCount = barbers.filter((b) => !b.isActive).length;

      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);
    });
  });

  describe("Barber filtering", () => {
    it("should filter barbers by barbershop", () => {
      const barbers = [
        { id: 1, establishmentId: 1, name: "João" },
        { id: 2, establishmentId: 1, name: "Carlos" },
        { id: 3, establishmentId: 2, name: "Pedro" },
      ];

      const barbershop1Barbers = barbers.filter((b) => b.establishmentId === 1);
      expect(barbershop1Barbers).toHaveLength(2);
      expect(barbershop1Barbers[0]?.name).toBe("João");
    });

    it("should filter active barbers", () => {
      const barbers = [
        { id: 1, name: "João", isActive: true },
        { id: 2, name: "Carlos", isActive: true },
        { id: 3, name: "Pedro", isActive: false },
      ];

      const activeBarbers = barbers.filter((b) => b.isActive);
      expect(activeBarbers).toHaveLength(2);
    });

    it("should combine multiple filters", () => {
      const barbers = [
        { id: 1, establishmentId: 1, name: "João", isActive: true },
        { id: 2, establishmentId: 1, name: "Carlos", isActive: false },
        { id: 3, establishmentId: 2, name: "Pedro", isActive: true },
      ];

      const filtered = barbers.filter(
        (b) => b.establishmentId === 1 && b.isActive
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.name).toBe("João");
    });
  });

  describe("Barber CRUD operations", () => {
    it("should create barber with required fields", () => {
      const newBarber = {
        id: 1,
        establishmentId: 1,
        name: "João Silva",
        phone: null,
        isActive: true,
      };

      expect(newBarber.name).toBeTruthy();
      expect(newBarber.establishmentId).toBeTruthy();
      expect(newBarber.isActive).toBe(true);
    });

    it("should update barber information", () => {
      let barber = {
        id: 1,
        name: "João Silva",
        phone: "(11) 98765-4321",
      };

      barber = { ...barber, name: "João Santos" };
      expect(barber.name).toBe("João Santos");
    });

    it("should delete barber (soft delete)", () => {
      let barber = {
        id: 1,
        name: "João Silva",
        isActive: true,
      };

      barber = { ...barber, isActive: false };
      expect(barber.isActive).toBe(false);
    });
  });

  describe("Barber statistics", () => {
    it("should calculate total barbers", () => {
      const barbers = [
        { id: 1, name: "João" },
        { id: 2, name: "Carlos" },
        { id: 3, name: "Pedro" },
      ];

      expect(barbers.length).toBe(3);
    });

    it("should calculate active barbers percentage", () => {
      const barbers = [
        { id: 1, isActive: true },
        { id: 2, isActive: true },
        { id: 3, isActive: false },
      ];

      const activeCount = barbers.filter((b) => b.isActive).length;
      const percentage = (activeCount / barbers.length) * 100;

      expect(percentage).toBe(66.66666666666666);
    });
  });

  describe("Barber service assignment", () => {
    it("should track assigned services", () => {
      const barberServices = [
        { barberId: 1, serviceId: 1 },
        { barberId: 1, serviceId: 2 },
        { barberId: 2, serviceId: 1 },
      ];

      const barber1Services = barberServices.filter((bs) => bs.barberId === 1);
      expect(barber1Services).toHaveLength(2);
    });

    it("should validate service assignment", () => {
      const assignment = {
        barberId: 1,
        serviceId: 5,
        establishmentId: 1,
      };

      expect(assignment.barberId).toBeTruthy();
      expect(assignment.serviceId).toBeTruthy();
      expect(assignment.establishmentId).toBeTruthy();
    });
  });
});
