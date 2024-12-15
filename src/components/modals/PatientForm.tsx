import React, { useEffect, useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface PatientFormProps {
  onClose: () => void;
}

export function PatientForm({ onClose }: PatientFormProps) {
  const { values, handleChange } = useForm({
    chartNumber: '',
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    gender: '',
    birthDate: '',
    phone: '',
    firstVisitDate: new Date().toISOString().split('T')[0],
    status: '初診/診断中',
    doctor: '',
  });

  const [chartNumber, setChartNumber] = useState('');

  useEffect(() => {
    // 组件加载时获取下一个カルテ番号
    const fetchNextChartNumber = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/next-chart-number');
        const data = await response.json();
        setChartNumber(data.chartNumber);
      } catch (error) {
        console.error('Error fetching next chart number:', error);
      }
    };
    
    fetchNextChartNumber();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log(values);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="院内カルテNo."
          name="chartNumber"
          value={chartNumber}
          disabled
          className="bg-gray-50"
        />
        <div className="col-span-1 row-span-3">
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">写真</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="姓"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            required
          />
          <Input
            label="名"
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="セイ"
            name="lastNameKana"
            value={values.lastNameKana}
            onChange={handleChange}
          />
          <Input
            label="メイ"
            name="firstNameKana"
            value={values.firstNameKana}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Select
          label="性別"
          name="gender"
          value={values.gender}
          onChange={handleChange}
          required
          options={[
            { value: 'male', label: '男性' },
            { value: 'female', label: '女性' },
            { value: 'other', label: 'その他' },
          ]}
        />
        <div className="flex items-center gap-4">
          <Input
            label="生年月日"
            type="date"
            name="birthDate"
            value={values.birthDate}
            onChange={handleChange}
            required
            className="flex-1"
          />
          <div className="mt-6">
            <span className="text-gray-700">0才</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Input
          label="初診日"
          type="date"
          name="firstVisitDate"
          value={values.firstVisitDate}
          onChange={handleChange}
          required
        />
        <Select
          label="治療状態"
          name="status"
          value={values.status}
          onChange={handleChange}
          required
          options={[
            { value: '初診/診断中', label: '初診/診断中' },
            { value: '治療中', label: '治療中' },
            { value: '完了', label: '完了' },
          ]}
        />
        <Input
          label="担当医"
          name="doctor"
          value={values.doctor}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Input
          label="電話番号"
          name="phone"
          value={values.phone}
          onChange={handleChange}
          placeholder="半角数字（ハイフンなし）"
        />
      </div>

      <div className="space-y-4">
        <button
          type="button"
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
        >
          + 保護者情報
        </button>
        <button
          type="button"
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
        >
          + 備考欄
        </button>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}