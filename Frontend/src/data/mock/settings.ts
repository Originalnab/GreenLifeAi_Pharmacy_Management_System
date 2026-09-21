import { 
  SystemProfile, 
  ApiCredentialsConfig, 
  PrinterConfig, 
  SystemLogEntry 
} from '../../types';

export const initialSystemProfile: SystemProfile = {
  legalName: 'Greenlife Pharmacy & Stores Ltd',
  tradeName: 'Greenlife Dispensary & Clinical Care',
  tagline: 'Your Trusted Neighborhood Healthcare & Wellness Partner',
  premisesLicense: 'PCN-LAG-00918/2026',
  superintendentName: 'Pharm. Amaka Okafor (B.Pharm, MPSN)',
  superintendentLicense: 'PCN-REG-882104',
  phone: '+234 803 123 4567 / +233 24 555 0192',
  email: 'dispensary@greenlife.pharmacy',
  address: 'Plot 14B, Commercial Avenue, Ikeja Medical District',
  city: 'Lagos',
  state: 'Lagos State',
  country: 'Ghana & Nigeria Hub',
  taxIdentificationNumber: 'TIN-991823019-GH',
  defaultVatPercent: 7.5,
  logoUrl: '',
  branchName: 'Ikeja Central Hospital Road (Main Hub)'
};

export const initialApiCredentials: ApiCredentialsConfig = {
  smsProvider: 'Termii',
  smsApiKey: 'termii_sec_live_99a81f0b2c34d8e7a6b5c4d3e2f10',
  smsSenderId: 'GreenlifeRx',
  smsEndpoint: 'https://api.ng.termii.com/api/sms/send',
  paymentGateway: 'Paystack',
  paymentPublicKey: 'pk_test_d8a7c6b5e4f3a2b1c0d9e8f7a6b5c4d3',
  paymentSecretKey: 'sk_test_1029384756abcdef0192837465abcde',
  isPaymentLive: false,
  nafdacRegistryApiKey: 'nafdac_pub_greenbook_v2_910283401',
  pcnComplianceApiKey: 'pcn_reg_live_oauth_881920394857'
};

export const initialPrinterConfig: PrinterConfig = {
  printerName: 'POS-80C Thermal Slip Printer',
  paperSize: '80mm',
  showLogo: true,
  showBarcode: true,
  showQrCode: true,
  showBatchDetails: true,
  showPrescriberInfo: true,
  headerNote: 'Licensed Clinical Community Pharmacy • PCN Premises Reg: PCN-LAG-00918',
  footerPolicy: 'Medicines dispensed in good condition are not returnable without pharmacist review. Keep medicines in a cool, dry place away from children.',
  fontScale: 'normal',
  autoCut: true,
  openDrawerOnPrint: true
};

export const initialSystemLogs: SystemLogEntry[] = [
  {
    id: 'log_py_001',
    timestamp: '2026-09-20 21:12:04',
    level: 'ERROR',
    source: 'BACKEND_PYTHON',
    component: 'app.services.inventory_service',
    path: '/api/v1/inventory/batches/quarantine',
    statusCode: 500,
    message: 'sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) insert or update on table "batch_quarantine_events" violates foreign key constraint',
    stackTrace: `Traceback (most recent call last):
  File "/opt/greenlife/backend/app/api/v1/endpoints/inventory.py", line 184, in quarantine_batch
    result = await inventory_service.quarantine(db=db, batch_id=batch_id, reason=payload.reason)
  File "/opt/greenlife/backend/app/services/inventory_service.py", line 92, in quarantine
    await db.commit()
  File "/opt/greenlife/backend/.venv/lib/python3.11/site-packages/sqlalchemy/ext/asyncio/session.py", line 612, in commit
    await self.sync_session.commit()
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) insert or update on table "batch_quarantine_events" violates foreign key constraint "fk_batch_id"
DETAIL:  Key (batch_id)=(batch_unk_992) is not present in table "batches".`
  },
  {
    id: 'log_py_002',
    timestamp: '2026-09-20 20:45:19',
    level: 'WARN',
    source: 'BACKEND_PYTHON',
    component: 'app.integrations.termii_client',
    path: '/api/v1/notifications/sms/dispense',
    statusCode: 429,
    message: 'HTTP 429 RateLimitExceeded: Termii SMS Gateway rate-limit ceiling reached for SenderID "GreenlifeRx". Automatic fallback to Twilio secondary queue engaged.',
    stackTrace: `[2026-09-20 20:45:19,411] [WARNING] [app.integrations.termii_client:L88]:
HTTPException: 429 Too Many Requests from gateway api.ng.termii.com
Payload: {"to": "+233244001122", "sms": "Your Rx #REC-002 is ready for pickup."}
Dispatcher: Retrying message via secondary queue "TwilioQueueWorker" in 450ms.`
  },
  {
    id: 'log_fe_003',
    timestamp: '2026-09-20 19:30:11',
    level: 'ERROR',
    source: 'FRONTEND',
    component: 'PointOfSale.PrintEngine',
    message: 'WebUSB/RawPrinter: Thermal slip printer "POS-80C" offline or out of paper. Spooling receipt to offline IndexedDB storage.',
    stackTrace: `Error: DeviceNotFound: No matching USB vendorId: 0x04b8 (Epson/Star ESC/POS)
    at ThermalPrinterDriver.connect (src/utils/thermalPrinter.ts:42:15)
    at printThermalReceipt (src/pages/pos/PointOfSalePage.tsx:189:7)
    at HTMLButtonElement.dispatch (node_modules/react-dom/client:14:281)`
  },
  {
    id: 'log_py_004',
    timestamp: '2026-09-20 18:14:52',
    level: 'CRITICAL',
    source: 'BACKEND_PYTHON',
    component: 'app.db.database_engine',
    path: '/api/v1/sales/checkout',
    statusCode: 503,
    message: 'asyncpg.exceptions.DeadlockDetectedError: deadlock detected between process 14092 (POS-TERMINAL-01) and process 14108 (POS-TERMINAL-02) on row "products:prod_para_500"',
    stackTrace: `Traceback (most recent call last):
  File "/opt/greenlife/backend/app/api/v1/endpoints/sales.py", line 210, in process_checkout
    sale = await sales_engine.execute_atomic_checkout(session, payload)
  File "/opt/greenlife/backend/app/services/sales_engine.py", line 145, in execute_atomic_checkout
    await session.execute(update(Product).where(Product.id == item.product_id).with_for_update())
asyncpg.exceptions.DeadlockDetectedError: deadlock detected
DETAIL:  Process 14092 waits for ExclusiveLock on tuple (4, 12) of relation 16394 of database 16384; blocked by process 14108.
Process 14108 waits for ExclusiveLock on tuple (4, 15) of relation 16394 of database 16384; blocked by process 14092.
HINT:  See server log for query details. Automatic retry succeeded on attempt 2.`
  },
  {
    id: 'log_db_005',
    timestamp: '2026-09-20 16:00:00',
    level: 'INFO',
    source: 'DATABASE',
    component: 'PostgreSQL 16 Engine / pg_dump',
    message: 'Periodic VACUUM ANALYZE completed on 42 relations. Dead tuples removed: 1,492. Index bloat mitigated.',
  },
  {
    id: 'log_fe_006',
    timestamp: '2026-09-20 14:22:30',
    level: 'WARN',
    source: 'FRONTEND',
    component: 'BarcodeScannerListener',
    message: 'Unrecognized barcode scan "0105038291028374": No product mapped in local catalogue. Prompting cashier for manual lookup.',
  }
];
