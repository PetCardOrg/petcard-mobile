import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';

import * as clinicService from '../services/clinic.service';
import type { PlaceSuggestion } from '../services/clinic.service';

/**
 * Piso de caracteres antes de consultar o Google.
 *
 * A API é cobrada por chamada e com uma ou duas letras a resposta é ruído —
 * o mesmo piso está validado no DTO da rota, do lado da API.
 */
export const MIN_QUERY_LENGTH = 3;

/** Janela de silêncio do teclado antes de disparar a busca. */
export const DEBOUNCE_MS = 350;

type UsePlaceAutocomplete = {
  suggestions: PlaceSuggestion[];
  isLoading: boolean;
  /** Agenda uma busca; cancela a anterior que ainda estiver no ar. */
  search: (query: string) => void;
  /** Encerra a sessão: limpa a lista e descarta a busca pendente. */
  reset: () => void;
};

/**
 * Sugere locais conforme o tutor digita.
 *
 * Três defesas contra desperdício, porque cada chamada é paga: o piso de
 * caracteres, o debounce e o `sessionToken` — que agrupa as teclas de uma mesma
 * edição numa única sessão de cobrança do Places em vez de uma por tecla.
 *
 * O viés de localização usa a última posição conhecida e **não** pede permissão:
 * quem só quer digitar um endereço não deveria levar um diálogo de GPS na cara.
 * Sem permissão concedida, o Google enviesa pelo IP.
 */
export function usePlaceAutocomplete(): UsePlaceAutocomplete {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sessionToken = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const coords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarPosicao() {
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted) return;
        const position = await Location.getLastKnownPositionAsync();
        if (ativo && position) {
          coords.current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        }
      } catch {
        // Viés de localização é opcional — sem ele a busca continua valendo.
      }
    }

    void carregarPosicao();
    return () => {
      ativo = false;
    };
  }, []);

  const cancelPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    inFlight.current?.abort();
    inFlight.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const reset = useCallback(() => {
    cancelPending();
    sessionToken.current = null;
    setSuggestions([]);
    setIsLoading(false);
  }, [cancelPending]);

  const search = useCallback(
    (query: string) => {
      cancelPending();

      const termo = query.trim();
      if (termo.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      timer.current = setTimeout(() => {
        const controller = new AbortController();
        inFlight.current = controller;
        sessionToken.current ??= Crypto.randomUUID();

        clinicService
          .autocompletePlaces({
            input: termo,
            lat: coords.current?.lat,
            lng: coords.current?.lng,
            sessionToken: sessionToken.current,
            signal: controller.signal,
          })
          .then((result) => {
            if (controller.signal.aborted) return;
            setSuggestions(result);
            setIsLoading(false);
          })
          .catch((error: unknown) => {
            // Uma busca cancelada foi substituída por outra: quem chegar depois
            // é que manda no estado. Mexer aqui apagaria a lista da busca nova.
            if (axios.isCancel(error)) return;
            setSuggestions([]);
            setIsLoading(false);
          });
      }, DEBOUNCE_MS);
    },
    [cancelPending],
  );

  return { suggestions, isLoading, search, reset };
}
