import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiAlertCircle, FiCalendar, FiClock } from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api"; 

// Helper para formato de fecha con hora (Ej: 15/10/2025 10:00)
const formatDateWithTime = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/* ===================== Tipos de datos usados en la búsqueda y avisos ===================== */
type Evento = {
    id: number;
    tipo?: string;
    fecha_hora?: string;
    propiedad?: number;
    nombre?: string;
    apellido?: string;
    email?: string;
    notas?: string;
};

type Propiedad = {
    id: number;
    titulo?: string;
    direccion?: string;
    estado?: string | null;
    disponibilidad?: string | null;
};

type Usuario = {
    id: number;
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
};

type SearchItem =
    | { type: "evento"; id: number; title: string; subtitle?: string }
    | { type: "propiedad"; id: number; title: string; subtitle?: string }
    | { type: "usuario"; id: number; title: string; subtitle?: string };

// Ajustamos el tipo de AvisoItem para reflejar el contexto del Lead
type AvisoItem = {
    id: number;
    nombre?: string;
    apellido?: string;
    last_contact_at?: string | null;
    next_contact_at?: string | null;
    next_contact_note?: string | null;
    proximo_contacto_estado?: string;
    dias_sin_seguimiento?: number | null;
    creado_en?: string;
    // Si el API de avisos devuelve más detalles (aunque la URL es /contactos/avisos/)
    propiedad_detalle?: { titulo: string };
};

type Bucket = { count: number; items: AvisoItem[] };
type AvisosPayload = {
    params: { recordame_cada: number; proximo_en_dias: number; limit: number };
    pendientes: Bucket;
    vencidos: Bucket;
    vence_hoy: Bucket;
    proximos: Bucket;
    sin_seguimiento: Bucket;
};

/* ===================== Hook simple para “debounce” (evita disparar fetch por cada tecla) ===================== */
function useDebouncedValue<T>(value: T, delay = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

/* ===================================== Componente ===================================== */
export default function Topbar({ title }: { title: string }) {
<<<<<<< HEAD
  const navigate = useNavigate();

  // Tomamos token si existe para pasar Authorization en fetch (memo para no recrear obj)
  const token = localStorage.getItem("rc_token") || "";
  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  /* ------------------------ Estado del buscador ------------------------ */
  const [query, setQuery] = useState("");       // texto del input
  const q = useDebouncedValue(query, 300);      // texto con debounce
  const [open, setOpen] = useState(false);      // si el dropdown está abierto
  const [loading, setLoading] = useState(false);// spinner de búsqueda
  const [results, setResults] = useState<SearchItem[]>([]); // resultados
  const wrapRef = useRef<HTMLDivElement | null>(null); // ref para detectar click afuera

  /* ------------------------ Estado de la campana (avisos) ------------------------ */
  const [openBell, setOpenBell] = useState(false); // popover abierto/cerrado
  const bellWrapRef = useRef<HTMLDivElement | null>(null);
  const [avisos, setAvisos] = useState<AvisosPayload | null>(null); // payload de avisos
  const [loadingAvisos, setLoadingAvisos] = useState(false);        // spinner de avisos
  const [errorAvisos, setErrorAvisos] = useState<string | null>(null);

  /* ------------------------ Cerrar popovers con click afuera o Escape ------------------------ */
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target as Node)) setOpenBell(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
=======
    const navigate = useNavigate();

    // ------- Search -------
    const [query, setQuery] = useState("");
    const q = useDebouncedValue(query, 300);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchItem[]>([]);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    // ------- Avisos (campana) -------
    const [openBell, setOpenBell] = useState(false);
    const bellWrapRef = useRef<HTMLDivElement | null>(null);
    const [avisos, setAvisos] = useState<AvisosPayload | null>(null);
    const [loadingAvisos, setLoadingAvisos] = useState(false);
    const [errorAvisos, setErrorAvisos] = useState<string | null>(null);

    // Variable de referencia para mantener el ID del intervalo activo
    const intervalRef = useRef<number | undefined>(undefined); 

    // Cerrar popovers al click fuera / Esc
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
            if (bellWrapRef.current && !bellWrapRef.current.contains(e.target as Node)) setOpenBell(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setOpen(false);
                setOpenBell(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    // Buscar cuando q cambia (mín 2 chars)
    useEffect(() => {
        async function run() {
            const text = q.trim();
            if (text.length < 2) {
                setResults([]);
                setLoading(false);
                return;
            }
            
            // 🔒 GUARDIA DE AUTENTICACIÓN
            if (!localStorage.getItem('rc_token')) {
                setLoading(false);
                return; 
            }

            setLoading(true);

            // USAMOS CLIENTE 'api' DE AXIOS
            try {
                const [evRes, prRes, usRes] = await Promise.all([
                    api.get(`/eventos/`, { params: { search: text } }),
                    api.get(`/propiedades/`, { params: { search: text } }),
                    api.get(`/usuarios/`, { params: { search: text } }),
                ]);

                // Django REST Framework usa 'data.results'
                const eventos: Evento[] = evRes.data?.results || [];
                const propiedades: Propiedad[] = prRes.data?.results || [];
                // La vista de usuarios puede no ser paginada
                const usuarios: Usuario[] = usRes.data?.results || usRes.data || [];

                const needle = text.toLowerCase();

                const eventosF = (Array.isArray(eventos) ? eventos : [])
                    .filter((e) =>
                        [e.tipo, e.nombre, e.apellido, e.email, e.notas]
                            .filter(Boolean)
                            .some((s) => String(s).toLowerCase().includes(needle))
                    )
                    .slice(0, 5)
                    .map<SearchItem>((e) => ({
                        type: "evento",
                        id: e.id,
                        title: `${e.tipo ?? "Evento"} ${e.nombre ? `• ${e.nombre}` : ""}`.trim(),
                        subtitle: e.fecha_hora ? new Date(e.fecha_hora).toLocaleString() : undefined,
                    }));

                const propiedadesF = (Array.isArray(propiedades) ? propiedades : [])
                    .filter((p) =>
                        [p.titulo, p.direccion, p.estado, p.disponibilidad]
                            .filter(Boolean)
                            .some((s) => String(s).toLowerCase().includes(needle))
                    )
                    .slice(0, 5)
                    .map<SearchItem>((p) => ({
                        type: "propiedad",
                        id: p.id,
                        title: p.titulo || `Propiedad #${p.id}`,
                        subtitle: [p.estado, p.disponibilidad].filter(Boolean).join(" • ") || undefined,
                    }));

                const usuariosF = (Array.isArray(usuarios) ? usuarios : [])
                    .filter((u) =>
                        [u.nombre, u.apellido, u.email, u.telefono]
                            .filter(Boolean)
                            .some((s) => String(s).toLowerCase().includes(needle))
                    )
                    .slice(0, 5)
                    .map<SearchItem>((u) => ({
                        type: "usuario",
                        id: u.id,
                        title: [u.nombre, u.apellido].filter(Boolean).join(" ") || `Usuario #${u.id}`,
                        subtitle: u.email,
                    }));

                setResults([...eventosF, ...propiedadesF, ...usuariosF]);
            } catch (e) {
                // Capturar error 401/403 de forma silenciosa si no se puede buscar
                setResults([]);
            } finally {
                setLoading(false);
            }
        }
        run();
    }, [q]); // Se ejecuta cuando 'q' cambia

    function onSelect(item: SearchItem) {
>>>>>>> 5e25755c4aec0e720dc5ffd0e1caf94445721e39
        setOpen(false);
        if (item.type === "propiedad") navigate("/app/propiedades");
        else if (item.type === "usuario") navigate("/app/usuarios");
        else navigate("/app"); // eventos → dashboard (por ahora)
    }

    // --------- Fetch avisos + auto-refresh ---------
    async function fetchAvisos() {
        // 🔒 GUARDIA DE AUTENTICACIÓN
        if (!localStorage.getItem('rc_token')) {
            setAvisos(null);
            setLoadingAvisos(false);
            return; 
        }

        setLoadingAvisos(true);
        setErrorAvisos(null);
        try {
            // USAMOS CLIENTE 'api' DE AXIOS
            const res = await api.get(`/contactos/avisos/`, { 
                params: { recordame_cada: 3, proximo_en_dias: 3, limit: 10 } 
            });
            
            const data: AvisosPayload = res.data; 
            setAvisos(data);
        } catch (e: any) {
            // 🔑 CORRECCIÓN CRÍTICA 401: Si el token falla, detenemos el polling
            if (e.response && e.response.status === 401) {
                 setAvisos(null);
                 // 🛑 Detener el intervalo si falla por 401
                 if (intervalRef.current !== undefined) {
                     clearInterval(intervalRef.current);
                     intervalRef.current = undefined; // Marcar como detenido
                 }
            } else {
                 setErrorAvisos("No se pudieron cargar los avisos.");
                 setAvisos(null);
            }
        } finally {
            setLoadingAvisos(false);
        }
    }

    // 🔑 CLAVE: Control de Polling y Listeners
    useEffect(() => {
        // Handlers para el evento global de refresco (desde Avisos/index.tsx)
        const handleRefresh = () => {
            if (localStorage.getItem('rc_token')) {
                fetchAvisos();
            }
        };
        
        // 🛑 Función para detener completamente el polling
        const stopPolling = () => {
            if (intervalRef.current !== undefined) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
            window.removeEventListener('avisos:refresh', handleRefresh);
        }

        // Función para iniciar el polling
        const startPolling = () => {
             // Detener cualquier polling existente para evitar duplicados
            stopPolling(); 

            if (localStorage.getItem('rc_token')) {
                fetchAvisos(); // Carga inicial
                // Usamos window.setInterval para el entorno web y guardamos el ID
                intervalRef.current = window.setInterval(fetchAvisos, 60_000) as unknown as number;
                window.addEventListener('avisos:refresh', handleRefresh);
            } else {
                // Si no hay token, aseguramos que el estado esté limpio
                setAvisos(null);
            }
        };

        // 3. Inicialización
        startPolling();

        return () => {
            // Cleanup al desmontar el componente
            stopPolling();
        };
    }, []); // Dependencia vacía para montar/desmontar

    const totalAvisos =
        (avisos?.vencidos.count ?? 0) +
        (avisos?.vence_hoy.count ?? 0) +
        (avisos?.proximos.count ?? 0); // Solo contamos los avisos que son urgentes

    function goAvisos() {
        setOpenBell(false);
        navigate("/app/avisos");
    }

<<<<<<< HEAD
  /* ------------------------ Buscar cuando cambia q (mín 2 chars) ------------------------ */
  useEffect(() => {
    async function run() {
      const text = q.trim();
      if (text.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Pedimos en paralelo: eventos, propiedades y usuarios
        const [evRes, prRes, usRes] = await Promise.all([
          fetch(`/api/eventos/?search=${encodeURIComponent(text)}`, { headers }),
          fetch(`/api/propiedades/?search=${encodeURIComponent(text)}`, { headers }),
          fetch(`/api/usuarios/`, { headers }),
        ]);

        const eventos: Evento[] = evRes.ok ? await evRes.json() : [];
        const propiedades: Propiedad[] = prRes.ok ? await prRes.json() : [];
        const usuarios: Usuario[] = usRes.ok ? await usRes.json() : [];

        // Normalizamos a “items” homogéneos para el dropdown
        const needle = text.toLowerCase();

        const eventosF = (Array.isArray(eventos) ? eventos : [])
          .filter((e) =>
            [e.tipo, e.nombre, e.apellido, e.email, e.notas]
              .filter(Boolean)
              .some((s) => String(s).toLowerCase().includes(needle))
          )
          .slice(0, 5)
          .map<SearchItem>((e) => ({
            type: "evento",
            id: e.id,
            title: `${e.tipo ?? "Evento"} ${e.nombre ? `• ${e.nombre}` : ""}`.trim(),
            subtitle: e.fecha_hora ? new Date(e.fecha_hora).toLocaleString() : undefined,
          }));

        const propiedadesF = (Array.isArray(propiedades) ? propiedades : [])
          .filter((p) =>
            [p.titulo, p.direccion, p.estado, p.disponibilidad]
              .filter(Boolean)
              .some((s) => String(s).toLowerCase().includes(needle))
          )
          .slice(0, 5)
          .map<SearchItem>((p) => ({
            type: "propiedad",
            id: p.id,
            title: p.titulo || `Propiedad #${p.id}`,
            subtitle: [p.estado, p.disponibilidad].filter(Boolean).join(" • ") || undefined,
          }));

        const usuariosF = (Array.isArray(usuarios) ? usuarios : [])
          .filter((u) =>
            [u.nombre, u.apellido, u.email, u.telefono]
              .filter(Boolean)
              .some((s) => String(s).toLowerCase().includes(needle))
          )
          .slice(0, 5)
          .map<SearchItem>((u) => ({
            type: "usuario",
            id: u.id,
            title: [u.nombre, u.apellido].filter(Boolean).join(" ") || `Usuario #${u.id}`,
            subtitle: u.email,
          }));

        setResults([...eventosF, ...propiedadesF, ...usuariosF]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
=======
    // ------ NUEVO: deeplink hacia Leads con filtros ------
    function goLeadsWith(opts: {
        vencimiento?: "pendiente" | "vencido" | "hoy" | "proximo";
        sin?: number | string;
        proximo_en_dias?: number | string;
    }) {
        const params = new URLSearchParams();
        if (opts.vencimiento) params.set("vencimiento", String(opts.vencimiento));
        if (typeof opts.sin !== "undefined" && opts.sin !== "") params.set("sin", String(opts.sin));
        if (typeof opts.proximo_en_dias !== "undefined")
            params.set("proximo_en_dias", String(opts.proximo_en_dias));
        setOpenBell(false);
        navigate(`/app/leads?${params.toString()}`);
>>>>>>> 5e25755c4aec0e720dc5ffd0e1caf94445721e39
    }

<<<<<<< HEAD
  // Navegación al elegir un resultado
  function onSelect(item: SearchItem) {
    setOpen(false);
    if (item.type === "propiedad") navigate("/app/propiedades");
    else if (item.type === "usuario") navigate("/app/usuarios");
    else navigate("/app"); // eventos → por ahora al dashboard
  }

  /* ------------------------ Avisos: fetch inicial + auto-refresh cada 60s ------------------------ */
  async function fetchAvisos() {
    if (!token) return; // sin token, no llamamos al backend
    setLoadingAvisos(true);
    setErrorAvisos(null);
    try {
      const res = await fetch(`/api/contactos/avisos/?recordame_cada=3&proximo_en_dias=3&limit=10`, { headers });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data: AvisosPayload = await res.json();
      setAvisos(data);
    } catch {
      setErrorAvisos("No se pudieron cargar los avisos.");
      setAvisos(null);
    } finally {
      setLoadingAvisos(false);
    }
  }

  useEffect(() => {
    fetchAvisos();
    const id = setInterval(fetchAvisos, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Total para el badge de la campana
  const totalAvisos =
    (avisos?.pendientes.count ?? 0) +
    (avisos?.vencidos.count ?? 0) +
    (avisos?.vence_hoy.count ?? 0) +
    (avisos?.proximos.count ?? 0) +
    (avisos?.sin_seguimiento.count ?? 0);

  // Atajos de navegación
  function goAvisos() {
    setOpenBell(false);
    navigate("/app/avisos");
  }
  function goLeadsWith(opts: {
    vencimiento?: "pendiente" | "vencido" | "hoy" | "proximo";
    sin?: number | string;
    proximo_en_dias?: number | string;
  }) {
    const params = new URLSearchParams();
    if (opts.vencimiento) params.set("vencimiento", String(opts.vencimiento));
    if (typeof opts.sin !== "undefined" && opts.sin !== "") params.set("sin", String(opts.sin));
    if (typeof opts.proximo_en_dias !== "undefined") params.set("proximo_en_dias", String(opts.proximo_en_dias));
    setOpenBell(false);
    navigate(`/app/leads?${params.toString()}`);
  }

  /* ------------------------ Render ------------------------ */
  return (
    // Topbar con borde inferior; colores vienen de la paleta rc-*
    <header className="flex items-center justify-between p-4 border-b rc-border">
      {/* Título de sección */}
      <h1 className="text-xl font-semibold rc-text">{title}</h1>

      <div className="flex items-center gap-3">
        {/* ------- Search ------- */}
        <div className="relative" ref={wrapRef}>
          <div className="relative">
            {/* Ícono del buscador (posición absoluta) */}
            <FiSearch className="absolute left-3 top-2.5 rc-muted pointer-events-none" />

            {/* Input del buscador: rc-input usa las variables del tema (bg/texto/borde/ring) */}
            <input
              placeholder="Buscar (eventos, propiedades, usuarios)…"
              className="rc-input w-72 pl-9 pr-3"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true); // abre el dropdown al empezar a tipear
              }}
              onFocus={() => setOpen(true)}
            />
          </div>

          {/* Dropdown de resultados del buscador */}
          {open && (loading || results.length > 0 || q.trim().length >= 2) && (
            <div className="absolute z-50 mt-1 w-[28rem] rounded-lg rc-card shadow-lg">
              <div className="max-h-80 overflow-auto">
                {loading && <div className="px-3 py-2 text-sm rc-muted">Buscando…</div>}

                {!loading && q.trim().length >= 2 && results.length === 0 && (
                  <div className="px-3 py-2 text-sm rc-muted">Sin coincidencias</div>
                )}

                {/* Lista de resultados */}
                {!loading &&
                  results.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => onSelect(r)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium rc-text">{r.title}</span>
                        <span className="text-[10px] uppercase tracking-wide rc-muted">{r.type}</span>
                      </div>
                      {r.subtitle && <div className="text-xs rc-muted">{r.subtitle}</div>}
                    </button>
                  ))}
              </div>

              {/* Pie del dropdown */}
              <div className="border-t rc-border p-2 text-right">
                <span className="text-[11px] rc-muted">Mínimo 2 caracteres • Enter para buscar</span>
              </div>
            </div>
          )}
        </div>

        {/* ------- Campana de avisos ------- */}
        <div className="relative" ref={bellWrapRef}>
          {/* Botón que abre/cierra el popover de avisos */}
          <button
            className="relative h-9 w-9 grid place-items-center rounded-lg border rc-border bg-[rgb(var(--card))]"
            onClick={() => setOpenBell((v) => !v)}
            title="Recordatorios y avisos"
          >
            <FiBell className="text-lg rc-text" />
            {/* Badge rojo con total de avisos */}
            {totalAvisos > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] grid place-items-center">
                {totalAvisos > 99 ? "99+" : totalAvisos}
              </span>
            )}
          </button>

          {/* Popover con buckets de avisos */}
          {openBell && (
            <div className="absolute right-0 z-50 mt-1 w-[26rem] rounded-lg rc-card shadow-lg">
              <div className="p-2 border-b rc-border flex items-center justify-between">
                <div className="text-sm font-medium rc-text">Recordatorios y avisos</div>
                <button className="text-xs underline rc-text" onClick={goAvisos}>
                  Ver todos
                </button>
              </div>

              <div className="max-h-96 overflow-auto">
                {loadingAvisos && <div className="px-3 py-2 text-sm rc-muted">Cargando…</div>}
                {errorAvisos && !loadingAvisos && (
                  <div className="px-3 py-2 text-sm text-rose-500">{errorAvisos}</div>
                )}

                {/* Listado por buckets (vencidos, hoy, próximos, etc.) */}
                {!loadingAvisos && !errorAvisos && avisos && (
                  <div className="divide-y rc-border/50">
                    <BucketSmall
                      icon={<FiAlertCircle />}
                      label="Vencidos"
                      items={avisos.vencidos.items}
                      emptyText="Sin vencidos"
                      onSee={() => goLeadsWith({ vencimiento: "vencido" })}
                    />
                    <BucketSmall
                      icon={<FiClock />}
                      label="Vence hoy"
                      items={avisos.vence_hoy.items}
                      emptyText="Nada vence hoy"
                      onSee={() => goLeadsWith({ vencimiento: "hoy" })}
                    />
                    <BucketSmall
                      icon={<FiCalendar />}
                      label="Próximos"
                      items={avisos.proximos.items}
                      emptyText="Sin próximos"
                      onSee={() =>
                        goLeadsWith({
                          vencimiento: "proximo",
                          proximo_en_dias: avisos.params.proximo_en_dias,
                        })
                      }
                    />
                    <BucketSmall
                      icon={<FiCalendar />}
                      label="Pendientes"
                      items={avisos.pendientes.items}
                      emptyText="Todos con fecha"
                      onSee={() => goLeadsWith({ vencimiento: "pendiente" })}
                    />
                    <BucketSmall
                      icon={<FiClock />}
                      label="Sin seguimiento"
                      items={avisos.sin_seguimiento.items}
                      emptyText="Todos con seguimiento reciente"
                      showSinSeg
                      onSee={() => goLeadsWith({ sin: avisos.params.recordame_cada })}
                    />
                  </div>
                )}

                {/* Estado sin datos */}
                {!loadingAvisos && !errorAvisos && !avisos && (
                  <div className="px-3 py-2 text-sm rc-muted">No hay datos de avisos.</div>
                )}
              </div>

              {/* Acción de refrescar */}
              <div className="border-t rc-border p-2">
                <button className="w-full h-8 rounded-md border rc-border text-xs" onClick={fetchAvisos}>
                  Actualizar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle claro/oscuro (aplica/quita .dark en <html>) */}
        <ThemeToggle />
      </div>
    </header>
  );
=======
    return (
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-3">
                {/* ------- Search ------- */}
                <div className="relative" ref={wrapRef}>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            placeholder="Buscar (eventos, propiedades, usuarios)…"
                            className="w-72 h-9 rounded-lg border border-gray-300 dark:border-gray-700 pl-9 pr-3 text-sm bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                        />
                    </div>

                    {/* Dropdown de resultados */}
                    {open && (loading || results.length > 0 || q.trim().length >= 2) && (
                        <div className="absolute right-0 z-50 mt-1 w-[28rem] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg">
                            <div className="max-h-80 overflow-auto">
                                {loading && (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Buscando…</div>
                                )}

                                {!loading && q.trim().length >= 2 && results.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        Sin coincidencias
                                    </div>
                                )}

                                {!loading &&
                                    results.map((r) => (
                                        <button
                                            key={`${r.type}-${r.id}`}
                                            onClick={() => onSelect(r)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{r.title}</span>
                                                <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    {r.type}
                                                </span>
                                            </div>
                                            {r.subtitle && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{r.subtitle}</div>
                                            )}
                                        </button>
                                    ))}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-800 p-2 text-right">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Mínimo 2 caracteres • Enter para buscar
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ------- Campana de avisos ------- */}
                <div className="relative" ref={bellWrapRef}>
                    <button
                        className="relative h-9 w-9 grid place-items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                        // Carga los datos ANTES de abrir si está cerrado
                        onClick={() => { 
                            if (!openBell) { 
                                fetchAvisos();
                            } 
                            setOpenBell((v) => !v); 
                        }}
                        title="Recordatorios y avisos"
                    >
                        <FiBell className="text-lg" />
                        {totalAvisos > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] grid place-items-center">
                                {totalAvisos > 99 ? "99+" : totalAvisos}
                            </span>
                        )}
                    </button>

                    {openBell && (
                        <div className="absolute right-0 z-50 mt-1 w-[26rem] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg">
                            <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div className="text-sm font-medium">Recordatorios y avisos</div>
                                <button
                                    className="text-xs underline text-blue-600 dark:text-blue-400"
                                    onClick={goAvisos}
                                >
                                    Ver todos
                                </button>
                            </div>

                            <div className="max-h-96 overflow-auto">
                                {loadingAvisos && (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Cargando…</div>
                                )}
                                {errorAvisos && !loadingAvisos && (
                                    <div className="px-3 py-2 text-sm text-rose-500">{errorAvisos}</div>
                                )}

                                {!loadingAvisos && !errorAvisos && avisos && (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                        <BucketSmall
                                            icon={<FiAlertCircle className="text-rose-500" />}
                                            label="Vencidos"
                                            items={avisos.vencidos.items}
                                            emptyText="Sin vencidos"
                                            onSee={() => goLeadsWith({ vencimiento: "vencido" })}
                                        />
                                        <BucketSmall
                                            icon={<FiClock className="text-violet-500" />}
                                            label="Vence hoy"
                                            items={avisos.vence_hoy.items}
                                            emptyText="Nada vence hoy"
                                            onSee={() => goLeadsWith({ vencimiento: "hoy" })}
                                        />
                                        <BucketSmall
                                            icon={<FiCalendar className="text-emerald-500" />}
                                            label="Próximos"
                                            items={avisos.proximos.items}
                                            emptyText="Sin próximos"
                                            onSee={() =>
                                                goLeadsWith({
                                                    vencimiento: "proximo",
                                                    proximo_en_dias: avisos.params.proximo_en_dias,
                                                })
                                            }
                                        />
                                        <BucketSmall
                                            icon={<FiCalendar className="text-gray-500" />}
                                            label="Pendientes"
                                            items={avisos.pendientes.items}
                                            emptyText="Todos con fecha"
                                            onSee={() => goLeadsWith({ vencimiento: "pendiente" })}
                                        />
                                        <BucketSmall
                                            icon={<FiClock className="text-amber-500" />}
                                            label="Sin seguimiento"
                                            items={avisos.sin_seguimiento.items}
                                            emptyText="Todos con seguimiento reciente"
                                            showSinSeg
                                            onSee={() =>
                                                goLeadsWith({ sin: avisos.params.recordame_cada })
                                            }
                                        />
                                    </div>
                                )}

                                {!loadingAvisos && !errorAvisos && !avisos && (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        No hay datos de avisos.
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-800 p-2">
                                <button
                                    className="w-full h-8 rounded-md border text-xs"
                                    onClick={fetchAvisos}
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <ThemeToggle />
            </div>
        </header>
    );
>>>>>>> 5e25755c4aec0e720dc5ffd0e1caf94445721e39
}

/* ===================== Subcomponente: bloque pequeño de avisos ===================== */
function BucketSmall({
    icon,
    label,
    items,
    emptyText,
    showSinSeg = false,
    onSee,
}: {
    icon: React.ReactNode;
    label: string;
    items: AvisoItem[];
    emptyText: string;
    showSinSeg?: boolean;
    onSee?: () => void;
}) {
<<<<<<< HEAD
  return (
    <div className="p-2">
      <div className="flex items-center gap-2 text-sm font-medium mb-1 rc-text">
        <span className="rc-muted">{icon}</span>
        <span>{label}</span>
        <span className="ml-auto text-xs rc-muted">{items.length}</span>
        {/* Link “Ver” que navega con filtros */}
        {onSee && (
          <button className="ml-2 text-[11px] underline rc-text" onClick={onSee} title="Ver en Leads">
            Ver
          </button>
        )}
      </div>

      {/* Lista o mensaje vacío */}
      {items.length === 0 ? (
        <div className="text-xs rc-muted">{emptyText}</div>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 5).map((it) => (
            <li key={`${label}-${it.id}`} className="text-xs rc-text">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{(it.nombre || "—") + " " + (it.apellido || "")}</span>
                <span className="text-[11px] rc-muted">
                  {it.next_contact_at
                    ? new Date(it.next_contact_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
                    : "—"}
                </span>
              </div>
              {showSinSeg && typeof it.dias_sin_seguimiento === "number" && (
                <div className="text-[11px] rc-muted">Sin seg.: {it.dias_sin_seguimiento} d</div>
              )}
              {it.next_contact_note && (
                <div className="text-[11px] rc-muted truncate">{it.next_contact_note}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
=======
    return (
        <div className="p-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <span className="text-gray-600 dark:text-gray-300">{icon}</span>
                <span>{label}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{items.length}</span>
                {onSee && (
                    <button
                        className="ml-2 text-[11px] underline text-blue-600 dark:text-blue-400"
                        onClick={onSee}
                        title="Ver en Leads"
                    >
                        Ver
                    </button>
                )}
            </div>
            {items.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">{emptyText}</div>
            ) : (
                <ul className="space-y-1">
                    {items.slice(0, 5).map((it) => {
                        const leadName = (it.nombre || 'Lead') + ' ' + (it.apellido || '');
                        const nextContactTime = it.next_contact_at
                            ? formatDateWithTime(it.next_contact_at)
                            : '—';
                        
                        // Construye la descripción detallada
                        const description = it.next_contact_note 
                            ? it.next_contact_note 
                            : 'Programado en Leads';

                        return (
                            <li key={`${label}-${it.id}`} className="text-xs p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                <div className="flex items-center justify-between gap-2 font-medium">
                                    <span className="truncate text-gray-900 dark:text-white">
                                        {leadName}
                                    </span>
                                    <span className={`text-[10px] px-1 py-0.5 rounded ${label === 'Vencidos' ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                        {label.split(' ')[0]}
                                    </span>
                                </div>
                                
                                <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                                    📅 {nextContactTime}
                                    <span className="ml-2">
                                        {it.next_contact_note ? ` • ${description}` : ''}
                                    </span>
                                </div>
                                
                                {showSinSeg && typeof it.dias_sin_seguimiento === "number" && (
                                    <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                        ⚠️ Sin seguimiento por {it.dias_sin_seguimiento} días
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
>>>>>>> 5e25755c4aec0e720dc5ffd0e1caf94445721e39
}
