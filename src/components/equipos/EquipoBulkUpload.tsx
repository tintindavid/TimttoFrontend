import React, { useState, useRef, useMemo } from 'react';
import { 
  Card, Form, Button, Row, Col, Spinner, Alert, 
  Table, Badge, Modal 
} from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { useItems } from '@/hooks/useItems';
import { useCreateEquipoItem } from '@/hooks/useEquipoItems';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { CreateEquipoItemDto } from '@/types/equipoItem.types';
import SedeFormModal from '@/components/customers/SedeFormModal';
import ServicioFormModal from '@/components/customers/ServicioFormModal';
import ItemFormModal from '@/components/items/ItemFormModal';
import Swal from 'sweetalert2';

interface EquipoBulkUploadProps {
  customerId: string;
  sedes: Sede[];
  servicios: Servicio[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ExcelRow {
  Equipo: string;
  Marca?: string;
  Modelo?: string;
  Serie?: string;
  Ubicacion?: string;
  Inventario?: string;
  Riesgo?: string;
  Invima?: string;
  ItemId?: string;
  ItemName?: string; // Para mostrar en preview cuando ItemId esté vacío
  Precio?: number; // Para mostrar en preview y usar en payload
}

interface ProcessedRow extends ExcelRow {
  id: number;
  valid: boolean;
  errors: string[];
  selectedItemId?: string; // Para ItemId seleccionado manualmente
}

const EquipoBulkUpload: React.FC<EquipoBulkUploadProps> = ({ 
  customerId, 
  sedes, 
  servicios, 
  onSuccess, 
  onCancel 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: itemsData } = useItems({ limit: 500 });
  const createMutation = useCreateEquipoItem();

  // Refetch sedes, servicios e items
  const { refetch: refetchSedes } = useSedesByCustomer(customerId);
  const { refetch: refetchServicios } = useServiciosByCustomer(customerId);
  const { refetch: refetchItems } = useItems({ limit: 500 });

  // Estados para modales
  const [showSedeModal, setShowSedeModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  console.log('showSedeModal:', showSedeModal);
  console.log('showServicioModal:', showServicioModal);
  console.log('showItemModal:', showItemModal);

  const [contextData, setContextData] = useState({
    Servicio: '',
    SedeId: '',
    mesesMtto: [] as string[]
  });

  const [excelData, setExcelData] = useState<ProcessedRow[]>([]);

  console.log('Excel Data:', excelData);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Items ordenados alfabéticamente
  const items = useMemo(() => {
    const rawItems = itemsData?.data || [];
    return [...rawItems].sort((a, b) => {
      const nameA = a.Nombre?.toUpperCase() || '';
      const nameB = b.Nombre?.toUpperCase() || '';
      return nameA.localeCompare(nameB);
    });
  }, [itemsData?.data]);

  // Opciones para react-select
  const itemOptions = useMemo(() => [
    { value: 'CREATE_NEW', label: '+ Crear Nuevo Item', isSpecial: true },
    ...items.map(item => ({
      value: item._id,
      label: item.Nombre
    }))
  ], [items]);

  const validateContext = (): boolean => {
    const errors: string[] = [];

    if (!contextData.Servicio) {
      errors.push('Debe seleccionar un servicio');
    }

    if (!contextData.SedeId) {
      errors.push('Debe seleccionar una sede');
    }

    if (contextData.mesesMtto.length === 0) {
      errors.push('Debe seleccionar al menos un mes de mantenimiento');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateContext()) return;

    // Leer archivo Excel real
    readExcelFile(file);
  };

  const readExcelFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Leer la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          raw: false, // Mantener valores como strings
          defval: '' // Valor por defecto para celdas vacías
        });

        console.log('Datos leídos del Excel:', jsonData);

        // Validar que tiene datos
        if (jsonData.length === 0) {
          alert('El archivo Excel está vacío');
          return;
        }

        // Procesar y validar cada fila con auto-selección de items
        const processedData = jsonData.map((row, index) => {
          // Buscar coincidencia automática del item por nombre
          const matchingItem = items.find(item => 
            item.Nombre?.toLowerCase().trim() === row.Equipo?.toLowerCase().trim()
          );
          
          // Crear objeto con datos actualizados incluyendo auto-selección
          const updatedRow = {
            ...row,
            ItemId: matchingItem?._id || row.ItemId,
            selectedItemId: matchingItem?._id
          };
          
          return validateRow(updatedRow, index + 1);
        });

        setExcelData(processedData);
        setShowPreview(true);
      } catch (error) {
        console.error('Error leyendo archivo Excel:', error);
        alert('Error al leer el archivo Excel. Verifique que el formato sea correcto.');
      }
    };

    reader.onerror = () => {
      alert('Error al leer el archivo');
    };

    reader.readAsBinaryString(file);
  };

  const validateRow = (row: ExcelRow & { selectedItemId?: string }, id: number): ProcessedRow => {
    const errors: string[] = [];
    let valid = true;

    if (!row.Equipo?.trim()) {
      errors.push('Nombre del equipo es obligatorio');
      valid = false;
    }

    // Si ItemId o selectedItemId está vacío, necesita selección manual
    if (!row.ItemId && !row.selectedItemId) {
      errors.push('Requiere selección de Item');
      valid = false;
    }

    return {
      ...row,
      id,
      valid,
      errors,
      selectedItemId: row.selectedItemId || row.ItemId
    };
  };

  const handleItemSelection = (rowId: number, itemId: string) => {
    setExcelData(prev => prev.map(row => 
      row.id === rowId 
        ? { 
            ...row, 
            selectedItemId: itemId,
            ItemId: itemId,
            valid: itemId !== '',
            errors: itemId ? [] : ['Requiere selección de Item']
          }
        : row
    ));
  };

  const handleMesesMttoChange = (mes: string, checked: boolean) => {
    setContextData(prev => ({
      ...prev,
      mesesMtto: checked 
        ? [...prev.mesesMtto, mes]
        : prev.mesesMtto.filter(m => m !== mes)
    }));
  };

  const handleBulkImport = async () => {
    const validRows = excelData.filter(row => row.valid);
    
    if (validRows.length === 0) {
      alert('No hay filas válidas para importar');
      return;
    }

    setUploading(true);

    try {
      // Procesar cada fila válida
      const promises = validRows.map(async (row) => {
        const payload: CreateEquipoItemDto = {
          item: row.Equipo || 'No definido',
          ClienteId: customerId,
          ItemId: row.selectedItemId || row.ItemId,
          Marca: row.Marca || 'No definido',
          Modelo: row.Modelo || 'No definido',
          Serie: row.Serie || 'No definido',
          Servicio: contextData.Servicio,
          SedeId: contextData.SedeId,
          Ubicacion: row.Ubicacion || 'No definido',
          Inventario: row.Inventario || 'No definido',
          Riesgo: row.Riesgo || 'No definido',
          Invima: row.Invima || 'No definido',
          Estado: 'Operativo',
          Precio: row.Precio || 0,
          mesesMtto: contextData.mesesMtto
        };

        return createMutation.mutateAsync(payload);
      });

      await Promise.all(promises);
      onSuccess?.();
    } catch (error) {
      console.error('Error en importación masiva:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setExcelData([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const meses = [
    { value: 'ene', label: 'Ene' },
    { value: 'feb', label: 'Feb' },
    { value: 'mar', label: 'Mar' },
    { value: 'abr', label: 'Abr' },
    { value: 'may', label: 'May' },
    { value: 'jun', label: 'Jun' },
    { value: 'jul', label: 'Jul' },
    { value: 'ago', label: 'Ago' },
    { value: 'sep', label: 'Sep' },
    { value: 'oct', label: 'Oct' },
    { value: 'nov', label: 'Nov' },
    { value: 'dic', label: 'Dic' }
  ];

  const validRowsCount = excelData.filter(row => row.valid).length;
  const invalidRowsCount = excelData.length - validRowsCount;

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Carga Masiva de Equipos desde Excel</h5>
      </Card.Header>
      <Card.Body>
        {/* Validaciones de contexto */}
        {validationErrors.length > 0 && (
          <Alert variant="danger">
            <ul className="mb-0">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Configuración del contexto */}
        <Card className="mb-4 bg-light">
          <Card.Body>
            <h6 className="text-muted mb-3">Configuración para Todos los Equipos</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Servicio *</Form.Label>
                  <Form.Select
                    value={contextData.Servicio}
                    onChange={(e) => {
                      if (e.target.value === 'CREATE_NEW') {
                        setShowServicioModal(true);
                        e.target.value = '';
                      } else {
                        setContextData(prev => ({ 
                          ...prev, 
                          Servicio: e.target.value 
                        }));
                      }
                    }}
                    required
                  >
                    <option value="">Seleccionar servicio...</option>
                    <option value="CREATE_NEW" style={{ color: '#0d6efd', fontWeight: 'bold' }}>+ Crear Nuevo Servicio</option>
                    {servicios.map((servicio) => (
                      <option key={servicio._id} value={servicio._id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sede *</Form.Label>
                  <Form.Select
                    value={contextData.SedeId}
                    onChange={(e) => {
                      if (e.target.value === 'CREATE_NEW') {
                        setShowSedeModal(true);
                        e.target.value = '';
                      } else {
                        setContextData(prev => ({ 
                          ...prev, 
                          SedeId: e.target.value 
                        }));
                      }
                    }}
                    required
                  >
                    <option value="">Seleccionar sede...</option>
                    <option value="CREATE_NEW" style={{ color: '#0d6efd', fontWeight: 'bold' }}>+ Crear Nueva Sede</option>
                    {sedes.map((sede) => (
                      <option key={sede._id} value={sede._id}>
                        {sede.nombreSede}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Meses de Mantenimiento *</Form.Label>
                  <div className="border rounded p-2" style={{ height: 'auto', overflowY: 'auto' }}>
                    <Row>
                      {meses.map((mes) => (
                        <Col xs={4} key={mes.value} className="mb-1">
                          <Form.Check
                            type="checkbox"
                            label={mes.label}
                            checked={contextData.mesesMtto.includes(mes.value)}
                            onChange={(e) => handleMesesMttoChange(mes.value, e.target.checked)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Upload de archivo */}
        {!showPreview && (
          <div className="text-center py-4 border border-dashed rounded">
            <h6>Seleccionar archivo Excel</h6>
            <p className="text-muted mb-3">
              El archivo debe contener columnas: Equipo, Marca, Modelo, Serie, Ubicacion, Inventario, Riesgo, Invima
            </p>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="mb-3"
              style={{ maxWidth: 400, margin: '0 auto' }}
            />
            <Button 
              variant="outline-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Examinar Archivos
            </Button>
          </div>
        )}

        {/* Preview de datos */}
        {showPreview && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-0">Preview de Equipos</h6>
                <small className="text-muted">
                  {validRowsCount} válidos, {invalidRowsCount} con errores
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={resetUpload}>
                  Cambiar Archivo
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleBulkImport}
                  disabled={validRowsCount === 0 || uploading}
                >
                  {uploading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Importando...
                    </>
                  ) : (
                    `Importar ${validRowsCount} Equipos`
                  )}
                </Button>
              </div>
            </div>

            <div className="table-responsive">
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Marca/Modelo</th>
                    <th>Serie/Inv.</th>
                    <th>Ubicación</th>
                    <th>Item</th>
                    <th>Estado</th>
                    <th>Validación</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row) => (
                    <tr key={row.id} className={row.valid ? '' : 'table-warning'}>
                      <td><strong>{row.Equipo}</strong></td>
                      <td>
                        <div>{row.Marca}</div>
                        <small className="text-muted">{row.Modelo}</small>
                      </td>
                      <td>
                        <div>{row.Serie}</div>
                        <small className="text-muted">Inv: {row.Inventario}</small>
                      </td>
                      <td>
                        <div>{row.Ubicacion}</div>
                        <small className="text-muted">
                          {row.Riesgo && `Riesgo: ${row.Riesgo}`}
                          {row.Invima && ` | Invima: ${row.Invima}`}
                        </small>
                      </td>
                      <td>
                        <Select
                          options={itemOptions}
                          value={itemOptions.find(opt => opt.value === row.selectedItemId) || null}
                          onChange={(selected) => {
                            if (selected?.value === 'CREATE_NEW') {
                              setShowItemModal(true);
                            } else {
                              handleItemSelection(row.id, selected?.value || '');
                            }
                          }}
                          placeholder="Seleccionar item..."
                          isClearable
                          isSearchable
                          noOptionsMessage={() => 'No se encontraron items'}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '31px',
                              fontSize: '0.875rem'
                            }),
                            option: (base, { data }: any) => ({
                              ...base,
                              color: data.isSpecial ? '#0d6efd' : base.color,
                              fontWeight: data.isSpecial ? 'bold' : base.fontWeight
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                          }}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      </td>
                      <td>
                        {row.valid ? (
                          <Badge bg="success">✓ Válido</Badge>
                        ) : (
                          <Badge bg="warning" title={row.errors.join(', ')}>
                            ⚠ Errores
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}

        {/* Botones de Acción */}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancelar
          </Button>
        </div>
      </Card.Body>

       {/* Modal para Crear Sede */}
      <SedeFormModal
        show={showSedeModal}
        onHide={() => setShowSedeModal(false)}
        customerId={customerId}
        onSuccess={async () => {
          await refetchSedes();
          await Swal.fire({
            icon: 'success',
            title: '¡Sede creada!',
            text: 'La sede se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />

      {/* Modal para Crear Servicio */}
      <ServicioFormModal
        show={showServicioModal}
        onHide={() => setShowServicioModal(false)}
        customerId={customerId}
        onSuccess={async () => {
          await refetchServicios();
          await Swal.fire({
            icon: 'success',
            title: '¡Servicio creado!',
            text: 'El servicio se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />

      {/* Modal para Crear Item */}
      <ItemFormModal 
        show={showItemModal}
        onHide={() => setShowItemModal(false)}
        onSuccess={async () => {
          await refetchItems();
          await Swal.fire({
            icon: 'success',
            title: '¡Item creado!',
            text: 'El item se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />
    </Card>
  );
};

export default EquipoBulkUpload;