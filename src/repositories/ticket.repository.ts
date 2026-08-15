import { sql } from '../config/db'

export interface IforteTicketResult {
  ticket_id: string
  insert_time: string
  ticket_status: string | null
  customer_id: string | null
  subscriber_id: string | null
  subscription_status: string | null
  subscriber_name: string | null
  ticket_subject: string | null
}

export interface MonitoringTargetResult {
  ticket_id: string
  subscriber_id: string
  subscriber_name: string
  ip_address: string | null
}

export interface UnassignedTicketResult {
  ticket_id: string
  subscriber_id: string
  subscriber_name: string
  type_id: number
  issue: string | null
  region_id: string | null
}

export interface VendorTicketResult {
  insert_time: string
  insert_timestamp: number
  subscriber_id: string | null
  subscriber_name: string | null
  request_number: string | null
  ticket_number: string | null
  category: string | null
  status: string | null
  ticket_id: string
  circuit_id: string | null
}

export interface EmployeeCallTicketSummary {
  employee_id: string
  name: string
  total_tickets: number
  tickets: number[]
}

export interface CreateTicketInput {
  priority: number
  reported_by: string
  reported_via: string
  contact_phone: string
  contact_name: string
  status: string
  problem: string
  employee_id: string
  subscriber_id: string
  customer_id: string
  type: number
}

export interface CreateTicketResult {
  ticket_id: number
}

export interface CreateFromCommandInput {
  subscriber_id: string | number
  type_id: string | number
  status: string
  subject: string
  comment: string
  inbox_id: number
  agent_email: string
  channel_id: string
  customer_phone_number: string
}

export interface CreateFromCommandResult {
  ticket_id: number
}

export interface TicketTypeResult {
  type_id: number
  type_descr: string
}

export interface EscalationTicketResult {
  subscriber_id: string
  ticket_id: string
  ticket_status: string
  problem: string
}

export class TicketRepository {
  async findActiveIforteTickets(): Promise<IforteTicketResult[]> {
    try {
      const results = await sql`
        SELECT
          fvt.ticket_id AS ticket_id,
          MAX(fvt.insert_time) AS insert_time,
          fvt.vendor_ticket_status AS ticket_status,
          cs.CustId AS customer_id,
          cs.CustServId AS subscriber_id,
          cs.CustStatus AS subscription_status,
          cs.CustAccName AS subscriber_name,
          REGEXP_REPLACE(substring_index(replace(t.Problem, '\r', ''), '\n', 1), '^Eskalasi ?: ?', '') AS ticket_subject
        FROM FiberVendorTickets fvt
        LEFT JOIN Tts t ON t.TtsId = fvt.ticket_id
        LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
        WHERE fvt.fiber_vendor_id = 22
          AND t.Status NOT IN ('Call', 'Pending', 'Cancel', 'Closed')
        GROUP BY fvt.ticket_id, fvt.vendor_ticket_status, cs.CustId, cs.CustServId, cs.CustStatus, cs.CustAccName, ticket_subject
        ORDER BY cs.CustStatus, insert_time
      `
      return results as unknown as IforteTicketResult[]
    } catch (error) {
      console.error('Database error in findActiveIforteTickets:', error)
      throw error
    }
  }

  async findMonitoringTargets(
    branches: string[],
    typeId: number,
  ): Promise<MonitoringTargetResult[]> {
    if (branches.length === 0) return []

    try {
      const results = await sql`
        SELECT
            t.TtsId AS ticket_id,
            t.CustServId AS subscriber_id,
            cs.CustAccName AS subscriber_name,
            SUBSTRING_INDEX(TRIM(cst.Network), '/', 1) AS ip_address
        FROM Tts t
        LEFT JOIN Customer c ON c.CustId = t.CustId
        LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
        LEFT JOIN CustomerServiceTechnical cst ON cst.CustServId = t.CustServId
        WHERE
            t.Status = 'Open'
            AND t.TtsTypeId = ${typeId}
            AND cst.Network LIKE '%/32'
            AND FIND_IN_SET(COALESCE(c.DisplayBranchId, c.BranchId), ${branches.join(',')}) > 0
      `
      return results as unknown as MonitoringTargetResult[]
    } catch (error) {
      console.error('Database error in findMonitoringTargets:', error)
      throw error
    }
  }

  async findUnassignedTickets(
    branch: string,
  ): Promise<UnassignedTicketResult[]> {
    try {
      const results = await sql`
        SELECT
            t.TtsId AS ticket_id,
            t.CustServId AS subscriber_id,
            cs.CustAccName AS subscriber_name,
            t.TtsTypeId AS type_id,
            TRIM(SUBSTRING_INDEX(t.Problem, '\\n', 1)) AS issue,
            COALESCE(c.DisplayBranchId, c.BranchId) AS region_id
        FROM Tts t
        LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
        LEFT JOIN Customer c ON c.CustId = cs.CustId
        WHERE
            c.BranchId = ${branch}
            AND t.Status = 'Open'
            AND t.TtsTypeId IN (1, 2)
            AND t.AssignedNo = 0
      `
      return results as unknown as UnassignedTicketResult[]
    } catch (error) {
      console.error('Database error in findUnassignedTickets:', error)
      throw error
    }
  }

  async findVendorTickets(vendorId: string): Promise<VendorTicketResult[]> {
    try {
      const results = await sql`
        SELECT
            fvt.insert_time,
            UNIX_TIMESTAMP(fvt.insert_time) AS insert_timestamp,
            cs.CustServId AS subscriber_id,
            cs.CustAccName AS subscriber_name,
            fvt.vendor_ticket_number AS request_number,
            fvt.vendor_escalation_ticket_number AS ticket_number,
            fvt.vendor_ticket_category AS category,
            fvt.vendor_ticket_status AS status,
            fvt.ticket_id,
            cstc.value AS circuit_id
        FROM FiberVendorTickets fvt
        LEFT JOIN Tts t ON t.TtsId = fvt.ticket_id
        LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
        LEFT JOIN CustomerServiceTechnicalLink cstl ON cstl.custServId = cs.CustServId
        LEFT JOIN CustomerServiceTechnicalCustom cstc ON cstc.technicalTypeId = cstl.id
            AND cstc.technicalType = 'link'
            AND cstc.attribute = 'Vendor CID'
        WHERE
            fvt.fiber_vendor_id = ${vendorId}
            AND t.Status NOT IN ('Call', 'Pending', 'Cancel', 'Closed')
            AND cstc.value IS NOT NULL
      `
      return results as unknown as VendorTicketResult[]
    } catch (error) {
      console.error('Database error in findVendorTickets:', error)
      throw error
    }
  }

  async getEmployeeSolvedTicketSummary(
    targetDate: string,
    excludedEmployeeIds: string[],
    departmentId: number,
  ): Promise<EmployeeCallTicketSummary[]> {
    try {
      const employeesData = await sql`
        SELECT EmpId, EmpFName, EmpLname 
        FROM Employee 
        WHERE EmpJoinStatus != 'QUIT' AND DeptId = ${departmentId}
      `

      const employeeNamesMap: Record<string, string> = {}
      for (const emp of employeesData) {
        const fullName = `${emp.EmpFName || ''} ${emp.EmpLname || ''}`.trim()
        employeeNamesMap[emp.EmpId as string] = fullName
      }

      const combinedData = await sql`
        SELECT tp.EmpId as employee_id, tu.TtsId as ticket_id 
        FROM TtsPIC tp 
        LEFT JOIN TtsUpdate tu ON tu.TtsId = tp.TtsId AND tu.AssignedNo = tp.AssignedNo 
        LEFT JOIN TtsChange tc ON tc.TtsUpdateId = tu.TtsUpdateId AND tc.field = 'Status' 
        WHERE DATE(tu.ActionStop) = ${targetDate} 
          AND tu.Status = 'Call' 
          AND tu.AssignedNo > 0 
          AND tc.NewValue = 'Call'
      `

      const employeeTickets: Record<string, number[]> = {}
      for (const row of combinedData) {
        const empId = row.employee_id as string
        const ticketId = row.ticket_id as number

        if (empId && ticketId) {
          if (!employeeTickets[empId]) {
            employeeTickets[empId] = []
          }
          if (!employeeTickets[empId].includes(ticketId)) {
            employeeTickets[empId].push(ticketId)
          }
        }
      }

      const sortedSummary = Object.entries(employeeTickets)
        .filter(([empId]) => {
          const isNameFound = employeeNamesMap[empId] !== undefined
          const isNotExcluded = !excludedEmployeeIds.includes(empId)
          return isNameFound && isNotExcluded
        })
        .sort(([, ticketsA], [, ticketsB]) => ticketsB.length - ticketsA.length)
        .map(([empId, tickets]) => {
          return {
            employee_id: empId,
            name: employeeNamesMap[empId],
            total_tickets: tickets.length,
            tickets: tickets,
          }
        })

      return sortedSummary
    } catch (error) {
      console.error('Database error in getEmployeeSolvedTicketSummary:', error)
      throw error
    }
  }

  async createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
    try {
      const result = await sql.begin(async (tx) => {
        const [inserted] = await tx`
          INSERT INTO Tts SET
            PostedTime = NOW(),
            Priority = ${input.priority},
            ReportedBy = ${input.reported_by},
            ReportedVia = ${input.reported_via},
            ContactNo = ${input.contact_phone},
            Status = ${input.status},
            Problem = ${input.problem},
            EmpId = ${input.employee_id},
            CustServId = ${input.subscriber_id},
            CustId = ${input.customer_id},
            TtsTypeId = ${input.type}
        `
        const ttsId = (inserted as unknown as { insertId: number }).insertId

        await tx`
          INSERT INTO TtsContact SET
            TtsId = ${ttsId},
            ContactName = ${input.contact_name},
            ContactNo = ${input.contact_phone}
        `

        await tx`
          INSERT INTO TtsContactLog SET
            TtsId = ${ttsId},
            ContactName = ${input.contact_name},
            ContactNo = ${input.contact_phone},
            InsertTime = NOW(),
            InsertBy = ${input.employee_id}
        `

        return { ticket_id: ttsId }
      })
      return result
    } catch (error) {
      console.error('Database error in createTicket:', error)
      throw error
    }
  }

  async createFromCommand(
    input: CreateFromCommandInput,
  ): Promise<CreateFromCommandResult> {
    console.debug('createFromCommand called with input:', input)
    try {
      const result = await sql.begin(async (tx) => {
        // Fetch CustId from CustomerServices
        const [custServResults] = await tx`
          SELECT CustId FROM CustomerServices WHERE CustServId = ${input.subscriber_id}
        `
        const custId = (custServResults as any)?.CustId || null
        console.debug('custId:', custId)

        // Fetch customer name from sms_phonebook
        const escapedPhone = String(input.customer_phone_number).replace(
          /[%_]/g,
          '\\$&',
        )
        const [phoneBookResults] = await tx`
          SELECT sp.name AS name FROM sms_phonebook sp
          WHERE CONCAT('+', phone) LIKE CONCAT('%+', ${escapedPhone})
          AND CustId = ${custId}
        `
        console.debug('phoneBookResults:', phoneBookResults)
        const customerName =
          (phoneBookResults as any)?.name || input.agent_email

        // Fetch EmpId from Employee
        const [empResults] = await tx`
          SELECT EmpId FROM Employee WHERE EmpEmail = ${input.agent_email}
        `
        let empId = (empResults as any)?.EmpId ?? null
        if (!empId) {
          console.warn(
            'EmpId not found for email',
            input.agent_email,
            '- using 0 as fallback',
          )
          empId = 0
        }
        console.debug('empId:', empId)

        await tx`
          INSERT INTO Tts SET
            TtsId = NULL,
            PostedTime = NOW(),
            Priority = 'Normal',
            ReportedBy = ${customerName},
            ReportedVia = 'WhatsApp',
            ContactNo = ${input.customer_phone_number},
            Status = ${input.status},
            Problem = ${input.subject},
            EmpId = ${empId},
            CustServId = ${input.subscriber_id},
            CustId = ${custId},
            TtsTypeId = ${Number(input.type_id)}
        `
        console.debug('Inserted Tts row')
        const [{ insertId }] = await tx`SELECT LAST_INSERT_ID() as insertId`
        const ttsId = insertId

        // (removed old logic, replaced above)

        await tx`
          INSERT INTO TtsContact SET
            TtsId = ${ttsId},
            ContactName = ${customerName},
            ContactNo = ${input.customer_phone_number}
        `

        // Insert into TtsUpdate table
        const noteText = `escalated from /command #${input.inbox_id} by ${input.agent_email}`
        await tx`
          INSERT INTO TtsUpdate SET
            TtsId = ${ttsId},
            UpdatedTime = NOW(),
            ActionStart = NOW(),
            ActionBegin = NOW(),
            ActionEnd = NOW(),
            ActionStop = NOW(),
            EmpId = ${empId},
            Note = ${noteText},
            Status = ${input.status},
            Action = ${input.comment}
        `
        console.debug('Inserted TtsUpdate for ticket', ttsId)

        return { ticket_id: ttsId }
      })
      return result
    } catch (error) {
      console.error('Database error in createFromCommand:', error)
      throw error
    }
  }

  async findTicketTypes(): Promise<TicketTypeResult[]> {
    try {
      const results = await sql`
        SELECT TtsTypeId AS type_id, TypeName AS type_descr
        FROM TtsType
        WHERE \`show\` = 1
      `
      return results as unknown as TicketTypeResult[]
    } catch (error) {
      console.error('Database error in findTicketTypes:', error)
      throw error
    }
  }

  async findActiveEscalationTickets(): Promise<EscalationTicketResult[]> {
    try {
      const results = await sql`
        SELECT
          CustServId AS subscriber_id,
          TtsId AS ticket_id,
          Status AS ticket_status,
          REGEXP_REPLACE(
            TRIM(SUBSTRING_INDEX(TRIM(Problem), '\n', 1)),
            '^Eskalasi ?:? ?',
            ''
          ) AS problem
        FROM Tts
        WHERE
          TtsTypeId = 10
          AND Status NOT IN ('Closed', 'Cancel', 'Call')
      `
      return results as unknown as EscalationTicketResult[]
    } catch (error) {
      console.error('Database error in findActiveEscalationTickets:', error)
      throw error
    }
  }
}
