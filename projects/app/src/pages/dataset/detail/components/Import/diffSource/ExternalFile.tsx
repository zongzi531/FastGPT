import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input
} from '@chakra-ui/react';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import MyIcon from '@fastgpt/web/components/common/Icon';
import Loading from '@fastgpt/web/components/common/MyLoading';
import { useContextSelector } from 'use-context-selector';
import { DatasetImportContext } from '../Context';
import { getFileIcon } from '@fastgpt/global/common/file/icon';
import { useI18n } from '@/web/context/I18n';
import { SmallAddIcon } from '@chakra-ui/icons';

const DataProcess = dynamic(() => import('../commonProgress/DataProcess'), {
  loading: () => <Loading fixed={false} />
});
const Upload = dynamic(() => import('../commonProgress/Upload'));

const ExternalFileCollection = () => {
  const activeStep = useContextSelector(DatasetImportContext, (v) => v.activeStep);

  return (
    <>
      {activeStep === 0 && <CustomLinkInput />}
      {activeStep === 1 && <DataProcess showPreviewChunks={true} />}
      {activeStep === 2 && <Upload />}
    </>
  );
};

export default React.memo(ExternalFileCollection);

const CustomLinkInput = () => {
  const { t } = useTranslation();
  const { datasetT, commonT } = useI18n();
  const { goToNext, sources, setSources } = useContextSelector(DatasetImportContext, (v) => v);
  const { register, reset, handleSubmit, control } = useForm<{
    list: {
      sourceName: string;
      sourceUrl: string;
      externalId: string;
    }[];
  }>({
    defaultValues: {
      list: [
        {
          sourceName: '',
          sourceUrl: '',
          externalId: ''
        }
      ]
    }
  });

  const {
    fields: list,
    append,
    remove,
    update
  } = useFieldArray({
    control,
    name: 'list'
  });

  useEffect(() => {
    if (sources.length > 0) {
      reset({
        list: sources.map((item) => ({
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl || '',
          externalId: item.externalId || ''
        }))
      });
    }
  }, []);

  return (
    <Box>
      <TableContainer>
        <Table bg={'white'}>
          <Thead>
            <Tr bg={'myGray.50'}>
              <Th>{datasetT('External url')}</Th>
              <Th>{datasetT('External id')}</Th>
              <Th>{datasetT('filename')}</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {list.map((item, index) => (
              <Tr key={item.id}>
                <Td>
                  <Input
                    {...register(`list.${index}.sourceUrl`, {
                      required: index !== list.length - 1,
                      onBlur(e) {
                        const val = (e.target.value || '') as string;
                        if (val.includes('.') && !list[index]?.sourceName) {
                          const sourceName = val.split('/').pop() || '';
                          update(index, {
                            ...list[index],
                            sourceUrl: val,
                            sourceName: decodeURIComponent(sourceName)
                          });
                        }
                        if (val && index === list.length - 1) {
                          append({
                            sourceName: '',
                            sourceUrl: '',
                            externalId: ''
                          });
                        }
                      }
                    })}
                  />
                </Td>
                <Td>
                  <Input {...register(`list.${index}.externalId`)} />
                </Td>
                <Td>
                  <Input {...register(`list.${index}.sourceName`)} />
                </Td>
                <Td>
                  <MyIcon
                    name={'delete'}
                    w={'16px'}
                    cursor={'pointer'}
                    _hover={{ color: 'red.600' }}
                    onClick={() => remove(index)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Flex mt={5} justifyContent={'space-between'}>
        <Button
          variant={'whitePrimary'}
          leftIcon={<SmallAddIcon />}
          onClick={() => {
            append({
              sourceName: '',
              sourceUrl: '',
              externalId: ''
            });
          }}
        >
          {commonT('Add new')}
        </Button>
        <Button
          isDisabled={list.length === 0}
          onClick={handleSubmit((data) => {
            setSources(
              data.list
                .filter((item) => !!item.sourceUrl)
                .map((item) => ({
                  id: getNanoid(32),
                  createStatus: 'waiting',
                  sourceName: item.sourceName || item.sourceUrl,
                  icon: getFileIcon(item.sourceUrl),
                  externalId: item.externalId,
                  sourceUrl: item.sourceUrl
                }))
            );

            goToNext();
          })}
        >
          {t('common.Next Step')}
        </Button>
      </Flex>
    </Box>
  );
};
