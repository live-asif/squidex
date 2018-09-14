﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschraenkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System;
using System.Threading.Tasks;
using Squidex.Domain.Apps.Core.Tags;
using Squidex.Infrastructure;
using Squidex.Infrastructure.Queries;

namespace Squidex.Domain.Apps.Entities.Assets.Queries
{
    public sealed class QueryTagVisitor : TransformVisitor
    {
        private readonly ITagService tagService;
        private readonly Guid appId;

        private QueryTagVisitor(Guid appId, ITagService tagService)
        {
            this.appId = appId;

            this.tagService = tagService;
        }

        public static FilterNode Transform(FilterNode nodeIn, Guid appId, ITagService tagService)
        {
            Guard.NotNull(tagService, nameof(tagService));

            return nodeIn.Accept(new QueryTagVisitor(appId, tagService));
        }

        public override FilterNode Visit(FilterComparison nodeIn)
        {
            if (string.Equals(nodeIn.Path[0], nameof(IAssetEntity.Tags), StringComparison.OrdinalIgnoreCase) && nodeIn.Value is string stringValue)
            {
                var tagNames = Task.Run(() => tagService.GetTagIdsAsync(appId, TagGroups.Assets, HashSet.Of(stringValue))).Result;

                if (tagNames.TryGetValue(stringValue, out var normalized))
                {
                    return new FilterComparison(nodeIn.Path, nodeIn.Operator, normalized, FilterValueType.String);
                }
            }

            return nodeIn;
        }
    }
}