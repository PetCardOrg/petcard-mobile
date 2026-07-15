import { api } from '../api';
import * as appointmentService from '../appointment.service';
import * as clinicService from '../clinic.service';
import * as deviceService from '../device.service';
import * as dewormingService from '../deworming.service';
import * as medicationService from '../medication.service';
import * as petService from '../pet.service';
import * as tutorService from '../tutor.service';
import * as vaccineService from '../vaccine.service';

// Os services de recurso são wrappers finos sobre `api`. Os testes verificam a
// construção de endpoint/params (a lógica real), com os verbos HTTP mockados.
const get = jest.spyOn(api, 'get');
const post = jest.spyOn(api, 'post');
const patch = jest.spyOn(api, 'patch');
const del = jest.spyOn(api, 'delete');

beforeEach(() => {
  get.mockResolvedValue({ data: [] });
  post.mockResolvedValue({ data: {} });
  patch.mockResolvedValue({ data: {} });
  del.mockResolvedValue({ data: undefined });
});

describe('pet.service', () => {
  it('lista, busca, cria, atualiza e remove nos endpoints certos', async () => {
    await petService.getMyPets();
    expect(get).toHaveBeenCalledWith('/pets');

    await petService.getPetById('p1');
    expect(get).toHaveBeenCalledWith('/pets/p1');

    await petService.createPet({ name: 'Rex' } as never);
    expect(post).toHaveBeenCalledWith('/pets', { name: 'Rex' });

    await petService.updatePet('p1', { name: 'Rex II' } as never);
    expect(patch).toHaveBeenCalledWith('/pets/p1', { name: 'Rex II' });

    await petService.deletePet('p1');
    expect(del).toHaveBeenCalledWith('/pets/p1');
  });
});

describe('tutor.service', () => {
  it('usa /tutors/me para o tutor atual', async () => {
    await tutorService.getCurrentTutor();
    expect(get).toHaveBeenCalledWith('/tutors/me');

    await tutorService.updateTutor('t1', { name: 'Ana' } as never);
    expect(patch).toHaveBeenCalledWith('/tutors/t1', { name: 'Ana' });
  });
});

describe('registros de saúde (endpoints aninhados por pet)', () => {
  it('vaccine: lista por pet e cria sob o pet do payload', async () => {
    await vaccineService.getVaccinesByPet('p1');
    expect(get).toHaveBeenCalledWith('/pets/p1/vaccines');

    await vaccineService.createVaccine({ pet_id: 'p1', name: 'V8' } as never);
    expect(post).toHaveBeenCalledWith('/pets/p1/vaccines', { pet_id: 'p1', name: 'V8' });

    await vaccineService.updateVaccine('v1', { name: 'V10' } as never);
    expect(patch).toHaveBeenCalledWith('/vaccines/v1', { name: 'V10' });
  });

  it('deworming: lista por pet e cria sob o pet do payload', async () => {
    await dewormingService.getDewormingsByPet('p1');
    expect(get).toHaveBeenCalledWith('/pets/p1/dewormings');

    await dewormingService.createDeworming({ pet_id: 'p1' } as never);
    expect(post).toHaveBeenCalledWith('/pets/p1/dewormings', { pet_id: 'p1' });
  });

  it('medication: lista por pet e cria sob o pet do payload', async () => {
    await medicationService.getMedicationsByPet('p1');
    expect(get).toHaveBeenCalledWith('/pets/p1/medications');

    await medicationService.createMedication({ pet_id: 'p1' } as never);
    expect(post).toHaveBeenCalledWith('/pets/p1/medications', { pet_id: 'p1' });
  });
});

describe('clinic.service', () => {
  it('busca lugares próximos passando os params de geolocalização', async () => {
    const params = { lat: -23.5, lng: -46.6, radiusKm: 5, openNow: true };
    await clinicService.findNearbyPlaces(params);
    expect(get).toHaveBeenCalledWith('/clinicas/places', { params });
  });
});

describe('device.service', () => {
  it('registra o device via POST /devices', async () => {
    await deviceService.register({ token: 'fcm-x', platform: 'android' } as never);
    expect(post).toHaveBeenCalledWith('/devices', { token: 'fcm-x', platform: 'android' });
  });
});

describe('appointment.service', () => {
  it('lista, filtra upcoming e remove', async () => {
    await appointmentService.getAll();
    expect(get).toHaveBeenCalledWith('/appointments');

    await appointmentService.getUpcoming();
    expect(get).toHaveBeenCalledWith('/appointments', { params: { upcoming: 'true' } });

    await appointmentService.remove('a1');
    expect(del).toHaveBeenCalledWith('/appointments/a1');
  });
});
