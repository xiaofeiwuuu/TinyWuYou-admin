import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { AdminUserApi } from '#/api/system/admin-user';

import { z } from '#/adapter/form';

export function getRoleOptions() {
  return [
    { color: 'red', label: '超级管理员', value: 'super_admin' },
    { color: 'orange', label: '管理员', value: 'admin' },
    { color: 'blue', label: '编辑', value: 'editor' },
    { color: 'default', label: '查看', value: 'viewer' },
  ];
}

export function useSchema(isEdit: boolean = false): VbenFormSchema[] {
  const baseSchema: VbenFormSchema[] = [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名',
        disabled: isEdit,
      },
      fieldName: 'username',
      label: '用户名',
      rules: z.string().min(3, '用户名至少3个字符').max(50, '用户名不能超过50个字符'),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入真实姓名',
      },
      fieldName: 'realName',
      label: '真实姓名',
      rules: z.string().min(2, '真实姓名至少2个字符').max(50, '真实姓名不能超过50个字符'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '超级管理员', value: 'super_admin' },
          { label: '管理员', value: 'admin' },
          { label: '编辑', value: 'editor' },
          { label: '查看', value: 'viewer' },
        ],
        optionType: 'button',
      },
      defaultValue: 'editor',
      fieldName: 'role',
      label: '角色',
      rules: z.string().min(1, '请选择角色'),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入邮箱',
      },
      fieldName: 'email',
      label: '邮箱',
      rules: z.string().email('请输入正确的邮箱格式').optional(),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号',
      },
      fieldName: 'phone',
      label: '手机号',
      rules: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号').optional(),
    },
  ];

  if (!isEdit) {
    baseSchema.splice(1, 0, {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入密码',
      },
      fieldName: 'password',
      label: '密码',
      rules: z.string().min(6, '密码至少6个字符').max(50, '密码不能超过50个字符'),
    });
  }

  return baseSchema;
}

export function useColumns(
  onActionClick?: OnActionClickFn<AdminUserApi.AdminUserInfo>,
  onStatusChange?: (
    newStatus: any,
    row: AdminUserApi.AdminUserInfo,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions<AdminUserApi.AdminUserInfo>['columns'] {
  return [
    { title: '序号', type: 'seq', width: 50 },
    {
      title: '用户名',
      field: 'username',
      minWidth: 120,
    },
    {
      title: '真实姓名',
      field: 'realName',
      minWidth: 120,
    },
    {
      title: '角色',
      field: 'role',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: getRoleOptions(),
      },
    },
    {
      title: '邮箱',
      field: 'email',
      minWidth: 180,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      title: '手机号',
      field: 'phone',
      width: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      title: '最后登录时间',
      field: 'lastLoginTime',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      title: '最后登录IP',
      field: 'lastLoginIp',
      width: 140,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      title: '状态',
      field: 'status',
      width: 100,
      cellRender: {
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
        attrs: { beforeChange: onStatusChange },
      },
    },
    {
      title: '创建时间',
      field: 'createdAt',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'username',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: '编辑' },
          { code: 'resetPassword', text: '修改密码' },
          { code: 'delete', text: '删除' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 180,
    },
  ];
}
