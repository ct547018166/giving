import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('excel') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    const data: any[] = [];

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip first row (headers)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row.length >= 4) {
          data.push({
            serial: row[0],
            nickname: row[1],
            time: row[2],
            gratitude: row[3]
          });
        }
      }
    });

    // Clear existing data before importing new data
    db.prepare('DELETE FROM gratitudes').run();

    // Insert into database
    const insert = db.prepare('INSERT INTO gratitudes (serial, nickname, time, gratitude) VALUES (?, ?, ?, ?)');
    const insertMany = db.transaction((items: any[]) => {
      for (const item of items) {
        insert.run(item.serial, item.nickname, item.time, item.gratitude);
      }
    });
    insertMany(data);

    return NextResponse.json({ message: `数据导入成功，已清空旧数据并导入 ${data.length} 条新记录`, count: data.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}