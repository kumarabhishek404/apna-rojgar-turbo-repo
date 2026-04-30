import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import React, { useCallback, useMemo, type ReactElement } from "react";
import debounce from "lodash/debounce";
import Colors from "@/constants/Colors";
import ListingsServices from "./ListingServices";
import APP_CONTEXT from "@/app/context/locale";

type Props = {
  listings: any[];
  isFetchingNextPage: boolean;
  loadMore: () => void;
  refreshControl: any;
  ListHeaderComponent?: ReactElement | null;
};

const RenderItem = React.memo(
  ({ item, locale }: any) => <ListingsServices item={item} />,
  (prev, next) => prev.item === next.item && prev.locale === next.locale,
);
RenderItem.displayName = "RenderItem";

const Separator = React.memo(() => <View style={styles.separator} />);
Separator.displayName = "Separator";

/** Space below last item — tab bar / scroll comfort; loader sits above this. */
const LIST_BOTTOM_INSET = 110;

const ListingsVerticalServices = ({
  listings,
  isFetchingNextPage,
  loadMore,
  refreshControl,
  ListHeaderComponent,
}: Props) => {
  const { locale } = APP_CONTEXT.useApp();
  const debouncedLoadMore = useMemo(() => debounce(loadMore, 300), [loadMore]);

  React.useEffect(() => {
    return () => {
      debouncedLoadMore.cancel();
    };
  }, [debouncedLoadMore]);

  const renderItem = useCallback(
    ({ item }: any) => <RenderItem item={item} locale={locale} />,
    [locale],
  );

  const keyExtractor = useCallback((item: any) => item._id, []);

  const ListFooter = useMemo(
    () => (
      <View style={styles.listFooter}>
        {isFetchingNextPage ? (
          <View style={styles.paginationLoader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : null}
        <View style={styles.listBottomInset} />
      </View>
    ),
    [isFetchingNextPage],
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        style={styles.flatList}
        data={listings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ListHeaderComponent ?? undefined}
        ItemSeparatorComponent={Separator}
        onEndReached={debouncedLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={ListFooter}
        extraData={locale}
        contentContainerStyle={styles.listContent}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={9}
        updateCellsBatchingPeriod={80}
        removeClippedSubviews={false}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ListingsVerticalServices;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 0,
  },
  flatList: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  listFooter: {
    width: "100%",
  },
  paginationLoader: {
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listBottomInset: {
    width: "100%",
    height: LIST_BOTTOM_INSET,
  },
});
