import { useVirtualizationHelpers } from '@syndesis/api';
import * as H from '@syndesis/history';
import { Virtualization } from '@syndesis/models';
import {
  ConfirmationButtonStyle,
  ConfirmationDialog,
  ConfirmationIconType,
  IVirtualizationAction,
  VirtualizationActions,
} from '@syndesis/ui';
import { useRouteData } from '@syndesis/utils';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { UIContext } from '../../../app';
import {
  canDelete,
  canExport,
  canPublish,
  canRevert,
  canStart,
  canStop,
} from './VirtualizationUtils';

/**
 * Action IDs.
 * @readonly
 * @enum {string}
 */
export enum VirtualizationActionId {
  Delete = 'delete-virt-action',
  Export = 'export-virt-action',
  Publish = 'publish-virt-action',
  Revert = 'revert-virt-action',
  Start = 'start-virt-action',
  Stop = 'stop-virt-action',
}

/**
 * @property {string} buttonText - the i18n confirm button text
 * @property {ConfirmationIconType} icon - the dialog icon
 * @property {string} message - the i18n dialog message text
 * @property {string} title - the i18n dialog title text
 * @property handleAction - callback for executing the action
 */
interface IPromptActionOptions {
  buttonText: string;
  icon: ConfirmationIconType;
  message: string;
  title: string;
  handleAction: () => void;
}

/**
 * @property {IVirtualizationAction} deleteActionProps - the customization of the delete action or `undefined` if the
 * default action properties are wanted
 * @property {IVirtualizationAction} exportActionProps - the customization of the export action or `undefined` if the
 * default action properties are wanted
 * @property {VirtualizationActionId[]} includeActions - the IDs of the actions wanted as buttons.
 * Leave `undefined` if the default actions are wanted. Set to an empty array of no action buttons are wanted.
 * @property {VirtualizationActionId[]} includeItems - the IDs of the actions wanted as kebab menu items.
 * Leave `undefined` if the default actions are wanted. Set to an empty array if no kebab menu is wanted.
 * @property {H.LocationDescriptorObject} postDeleteHref - the virtualization whose actions are being requested
 * @property {IVirtualizationAction} publishActionProps - the customization of the publish action or `undefined` if the
 * default action properties are wanted
 * @property {IVirtualizationAction} revertActionProps - the customization of the revert action or `undefined` if the
 * default action properties are wanted
 * @property {IVirtualizationAction} revision - the revision for action or `undefined` if not required.
 * @property {IVirtualizationAction} saveActionProps - the customization of the save action or `undefined` if the
 * default action properties are wanted
 * @property {IVirtualizationAction} startActionProps - the customization of the start action or `undefined` if the
 * default action properties are wanted
 * @property {IVirtualizationAction} stopActionProps - the customization of the stop action or `undefined` if the
 * default action properties are wanted
 * @property {Virtualization} virtualization - the virtualization whose actions are being requested
 */
export interface IVirtualizationActionContainerProps {
  deleteActionProps?: IVirtualizationAction;
  exportActionProps?: IVirtualizationAction;
  includeActions?: VirtualizationActionId[];
  includeItems?: VirtualizationActionId[];
  postDeleteHref?: H.LocationDescriptorObject;
  publishActionProps?: IVirtualizationAction;
  revertActionProps?: IVirtualizationAction;
  revision?: number;
  saveActionProps?: IVirtualizationAction;
  startActionProps?: IVirtualizationAction;
  stopActionProps?: IVirtualizationAction;
  virtualization: Virtualization;
}

/**
 * A component containing a row of zero or more buttons followed by an optional kebab menu
 * with one or more menu items.
 * @param props the properties that configure the action container
 */
export const VirtualizationActionContainer: React.FunctionComponent<
  IVirtualizationActionContainerProps
> = props => {
  /**
   * Context that broadcasts global notifications.
   */
  const { pushNotification } = React.useContext(UIContext);

  /**
   * Hook to handle localization.
   */
  const { t } = useTranslation(['data', 'shared']);

  /**
   * Hook to handle browser navigation.
   */
  const { history } = useRouteData<null, null>();

  /**
   * Hook to handle when confirmation dialog is visible.
   */
  const [promptActionOptions, setPromptActionOptions] = React.useState();

  /**
   * Hook to indicate when the dialog should be visible.
   */
  const [showDialog, setShowDialog] = React.useState(false);

  /**
   * Hook that makes the backend calls.
   */
  const {
    deleteVirtualization,
    exportVirtualization,
    publishVirtualization,
    revertVirtualization,
    startVirtualization,
    unpublishVirtualization,
  } = useVirtualizationHelpers();

  /**
   * Creates a custom delete action by overriding property defaults. If there are no `customProps` the
   * default action is returned.
   * @example
   *    createDeleteAction(
   *      { as: 'danger',
   *        disabled: false,
   *        i18nLabel: 'My Delete',
   *        onClick: () => alert('onClick for delete action')
   *      }
   *    );
   * @param customProps the values used instead of the default values
   */
  const createDeleteAction = (customProps?: any): IVirtualizationAction => {
    if (!customProps) {
      return deleteAction;
    }

    return {
      ...deleteAction,
      ...customProps,
    };
  };

  /**
   * The default delete action.
   */
  const deleteAction: IVirtualizationAction = {
    disabled: false,
    i18nLabel: t('shared:Delete'),
    id: VirtualizationActionId.Delete,
    onClick: async () => {
      setPromptActionOptions({
        buttonText: 'Delete',
        handleAction: async () => {
          await deleteVirtualization(props.virtualization.name).catch(
            (e: any) => {
              // inform user of error
              pushNotification(
                t('deleteVirtualizationFailed', {
                  details: e.errorMessage || e.message || e,
                  name: props.virtualization.name,
                }),
                'error'
              );
            }
          );

          // redirect if requested
          if (props.postDeleteHref) {
            history.push(props.postDeleteHref);
          }
        },
        icon: ConfirmationIconType.DANGER,
        message: 'Are you sure you want to delete?',
        title: 'Confirm Delete?',
      } as IPromptActionOptions);
      setShowDialog(true);
    },
  };

  /**
   * Creates a custom export action by overriding property defaults. If there are no `customProps` then the
   * default action is returned.
   * @example
   *    createExportAction(
   *      { as: 'danger',
   *        disabled: false,
   *        i18nLabel: 'My Export',
   *        onClick: () => alert('onClick for export action')
   *      }
   *    );
   * @param customProps the values used instead of the default values
   */
  const createExportAction = (customProps?: any): IVirtualizationAction => {
    if (!customProps) {
      return exportAction;
    }

    return {
      ...exportAction,
      ...customProps,
    };
  };

  /**
   * The default export action.
   */
  const exportAction: IVirtualizationAction = {
    as: 'default',
    disabled: false,
    i18nLabel: t('shared:Export'),
    id: VirtualizationActionId.Export,
    onClick: async () => {
      exportVirtualization(props.virtualization.name).catch((e: any) => {
        // notify user of error
        pushNotification(
          t('exportVirtualizationFailed', {
            details: e.errorMessage || e.message || e,
            name: props.virtualization.name,
          }),
          'error'
        );
      });
    },
  };

  /**
   * Creates a custom publish action by overriding property defaults. If there are no `customProps` then the
   * default action is returned.
   * @example
   *    createPublishAction(
   *      { as: 'danger',
   *        disabled: false,
   *        i18nLabel: 'My Publish',
   *        onClick: () => alert('onClick for publish action')
   *      }
   *    );
   * @param customProps the values used instead of the default values
   */
  const createPublishAction = (customProps?: any): IVirtualizationAction => {
    if (!customProps) {
      return publishAction;
    }

    return {
      ...publishAction,
      ...customProps,
    };
  };

  /**
   * The default publish action.
   */
  const publishAction: IVirtualizationAction = {
    as: 'primary',
    disabled: false,
    i18nLabel: t('shared:Publish'),
    id: VirtualizationActionId.Publish,
    onClick: async () => {
      if (props.virtualization.empty) {
        pushNotification(
          t('publishVirtualizationNoViews', {
            name: props.virtualization.name,
          }),
          'info'
        );
        const e = new Error();
        e.name = 'NoViews';
        throw e;
      }

      publishVirtualization(props.virtualization.name).catch((e: any) => {
        pushNotification(
          t('publishVirtualizationFailed', {
            details: e.errorMessage || e.message || e,
            name: props.virtualization.name,
          }),
          'error'
        );
      });
    },
  };

  /**
   * Creates a custom revert action by overriding property defaults. If there are no `customProps` then the
   * default action is returned.
   * @example
   *    createRevertAction(
   *      { as: 'danger',
   *        disabled: false,
   *        i18nLabel: 'My Revert',
   *        onClick: () => alert('onClick for revert action')
   *      }
   *    );
   * @param customProps the values used instead of the default values
   */
  const createRevertAction = (customProps?: any): IVirtualizationAction => {
    if (!customProps) {
      return revertAction;
    }

    return {
      ...revertAction,
      ...customProps,
    };
  };

  /**
   * The default revert action.
   */
  const revertAction: IVirtualizationAction = {
    as: 'primary',
    disabled: false,
    i18nLabel: t('shared:Revert'),
    id: VirtualizationActionId.Revert,
    onClick: async () => {
      setPromptActionOptions({
        buttonText: 'Revert',
        handleAction: async () => {
          await revertVirtualization(
            props.virtualization.name,
            props.revision!
          ).catch((e: any) => {
            // inform user of error
            pushNotification(
              t('revertVirtualizationFailed', {
                details: e.errorMessage || e.message || e,
                name: props.virtualization.name,
              }),
              'error'
            );
          });
        },
        icon: ConfirmationIconType.DANGER,
        message: t('revertVirtualizationConfirmMsg', {
          name: props.virtualization.name,
          version: props.revision,
        }),
        title: t('revertVirtualizationConfirmTitle'),
      } as IPromptActionOptions);
      setShowDialog(true);
    },
  };

  /**
   * Creates a custom start action by overriding property defaults. If there are no `customProps` then the
   * default action is returned.
   * @example
   *    createStartAction(
   *      { as: 'danger',
   *        disabled: false,
   *        i18nLabel: 'My Start',
   *        onClick: () => alert('onClick for start action')
   *      }
   *    );
   * @param customProps the values used instead of the default values
   */
  const createStartAction = (customProps?: any): IVirtualizationAction => {
    if (!customProps) {
      return startAction;
    }

    return {
      ...startAction,
      ...customProps,
    };
  };

  /**
   * The default start action.
   */
  const startAction: IVirtualizationAction = {
    disabled: false,
    i18nLabel: t('shared:Start'),
    id: VirtualizationActionId.Start,
    onClick: async () => {
      setPromptActionOptions({
        buttonText: 'start',
        handleAction: async () => {
          await startVirtualization(
            props.virtualization.name,
            props.revision!
          ).catch((e: any) => {
            // inform user of error
            pushNotification(
              t('startVirtualizationFailed', {
                details: e.errorMessage || e.message || e,
                name: props.virtualization.name,
              }),
              'error'
            );
          });
        },
        icon: ConfirmationIconType.DANGER,
        message: t('startVirtualizationConfirmMsg', {
          name: props.virtualization.name,
          version: props.revision,
        }),
        title: t('startVirtualizationConfirmTitle'),
      } as IPromptActionOptions);
      setShowDialog(true);
    },
  };

  /**
   * Creates a custom stop/unpublish action by overriding property defaults. If there are no `customProps` then the
   * default action is returned.
   * @example
   *    createStopAction(
   *      { as: 'danger',
   *        disabled: false,
   *        i18nLabel: 'My Stop',
   *        onClick: () => alert('onClick for stop action')
   *      }
   *    );
   * @param customProps the values used instead of the default values
   */
  const createStopAction = (customProps?: any): IVirtualizationAction => {
    if (!customProps) {
      return stopAction;
    }

    return {
      ...stopAction,
      ...customProps,
    };
  };

  /**
   * The default stop/unpublish action.
   */
  const stopAction: IVirtualizationAction = {
    disabled: false,
    i18nLabel: t('shared:Stop'),
    id: VirtualizationActionId.Stop,
    onClick: async () => {
      unpublishVirtualization(props.virtualization.name).catch((e: any) => {
        if (e.name === 'AlreadyUnpublished') {
          pushNotification(
            t('unpublishedVirtualization', {
              name: props.virtualization.name,
            }),
            'info'
          );
        } else {
          pushNotification(
            t('unpublishVirtualizationFailed', {
              details: e.errorMessage || e.message || e,
              name: props.virtualization.name,
            }),
            'error'
          );
        }
      });
    },
  };

  /*
    running - modified
      revert, export, publish | stop, delete
    running - not modified
      export, publish(disabled) | stop, delete
    stopped - modified
      export, publish | delete
    stopped - not modified
      export, publish(disabled) | delete
  */

  // export, publish are default action buttons
  const getActions = (): IVirtualizationAction[] => {
    const actions: IVirtualizationAction[] = [];

    // default actions
    if (!props.includeActions) {
      if (canRevert(props.virtualization, props.revision)) {
        actions.push(
          props.revertActionProps
            ? createRevertAction(props.revertActionProps)
            : revertAction
        );
      }
      if (canExport(props.virtualization)) {
        actions.push(
          props.exportActionProps
            ? createExportAction(props.exportActionProps)
            : exportAction
        );
      }
      // The publish is always included, but may be disabled
      if (!canPublish(props.virtualization)) {
        actions.push(createPublishAction({ disabled: true }));
      } else {
        actions.push(
          props.publishActionProps
            ? createPublishAction(props.publishActionProps)
            : publishAction
        );
      }

      return actions;
    }

    // no actions
    if (props.includeActions.length === 0) {
      return actions;
    }

    // custom actions
    props.includeActions.forEach(actionId => {
      switch (actionId) {
        case VirtualizationActionId.Delete:
          if (canDelete(props.virtualization)) {
            actions.push(
              props.deleteActionProps
                ? createDeleteAction(props.deleteActionProps)
                : deleteAction
            );
          }
          break;
        case VirtualizationActionId.Export:
          if (canExport(props.virtualization)) {
            actions.push(
              props.exportActionProps
                ? createExportAction(props.exportActionProps)
                : exportAction
            );
          }
          break;
        case VirtualizationActionId.Publish:
          if (canPublish(props.virtualization)) {
            actions.push(
              props.publishActionProps
                ? createPublishAction(props.publishActionProps)
                : publishAction
            );
          }
          break;
        case VirtualizationActionId.Revert:
          if (canRevert(props.virtualization, props.revision)) {
            actions.push(
              props.revertActionProps
                ? createRevertAction(props.revertActionProps)
                : revertAction
            );
          }
          break;
        case VirtualizationActionId.Start:
          if (canStart(props.virtualization, props.revision)) {
            actions.push(
              props.startActionProps
                ? createStartAction(props.startActionProps)
                : startAction
            );
          }
          break;
        case VirtualizationActionId.Stop:
          if (canStop(props.virtualization)) {
            actions.push(
              props.stopActionProps
                ? createStopAction(props.stopActionProps)
                : stopAction
            );
          }
          break;
        default:
          // include all VirtualizationActionIds above
          break;
      }
    });
    return actions;
  };

  // delete, start, stop are default actions for kebab menu
  const getItems = (): IVirtualizationAction[] => {
    const items: IVirtualizationAction[] = [];

    // default items
    if (!props.includeItems) {
      if (canStop(props.virtualization)) {
        items.push(
          props.stopActionProps
            ? createStopAction(props.stopActionProps)
            : stopAction
        );
      }

      if (canDelete(props.virtualization)) {
        items.push(
          props.deleteActionProps
            ? createDeleteAction(props.deleteActionProps)
            : deleteAction
        );
      }

      return items;
    }

    // no items
    if (props.includeItems.length === 0) {
      return items;
    }

    // custom actions
    props.includeItems.forEach(actionId => {
      switch (actionId) {
        case VirtualizationActionId.Delete:
          if (canDelete(props.virtualization)) {
            items.push(
              props.deleteActionProps
                ? createDeleteAction(props.deleteActionProps)
                : deleteAction
            );
          }
          break;
        case VirtualizationActionId.Export:
          if (canExport(props.virtualization)) {
            items.push(
              props.exportActionProps
                ? createExportAction(props.exportActionProps)
                : exportAction
            );
          }
          break;
        case VirtualizationActionId.Publish:
          if (canPublish(props.virtualization)) {
            items.push(
              props.publishActionProps
                ? createPublishAction(props.publishActionProps)
                : publishAction
            );
          }
          break;
        case VirtualizationActionId.Revert:
          if (canRevert(props.virtualization, props.revision)) {
            items.push(
              props.revertActionProps
                ? createRevertAction(props.revertActionProps)
                : revertAction
            );
          }
          break;
        case VirtualizationActionId.Start:
          if (canStart(props.virtualization, props.revision)) {
            items.push(
              props.startActionProps
                ? createStartAction(props.startActionProps)
                : startAction
            );
          }
          break;
        case VirtualizationActionId.Stop:
          if (canStop(props.virtualization)) {
            items.push(
              props.stopActionProps
                ? createStopAction(props.stopActionProps)
                : stopAction
            );
          }
          break;
        default:
          // include all VirtualizationActionIds above
          break;
      }
    });
    return items;
  };

  const handleActionCancel = () => {
    setShowDialog(false);
  };

  const handleAction = () => {
    const action = promptActionOptions.handleAction;
    setShowDialog(false);

    if (typeof action === 'function') {
      action();
    } else {
      throw Error('Undefined action set for confirmation dialog');
    }
  };

  return (
    <>
      {promptActionOptions && (
        <ConfirmationDialog
          buttonStyle={ConfirmationButtonStyle.NORMAL}
          i18nCancelButtonText={t('shared:Cancel')}
          i18nConfirmButtonText={promptActionOptions.buttonText}
          i18nConfirmationMessage={promptActionOptions.message}
          i18nTitle={promptActionOptions.title}
          icon={promptActionOptions.icon}
          showDialog={showDialog}
          onCancel={handleActionCancel}
          onConfirm={handleAction}
        />
      )}
      <VirtualizationActions
        actions={getActions()}
        items={getItems()}
        virtualizationName={props.virtualization.name}
      />
    </>
  );
};
